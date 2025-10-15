from flask import Flask, request, jsonify
import yt_dlp
import json
import os
from urllib.parse import urlparse
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# CORS headers
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

@app.after_request
def after_request(response):
    return add_cors_headers(response)

def validate_url(url):
    """Validasi URL dari platform yang didukung"""
    try:
        parsed = urlparse(url)
        allowed_domains = [
            'tiktok.com', 'vt.tiktok.com', 'vm.tiktok.com',
            'instagram.com', 'www.instagram.com',
            'threads.net', 'www.threads.net'
        ]
        return any(domain in parsed.netloc for domain in allowed_domains)
    except Exception as e:
        logger.error(f"URL validation error: {e}")
        return False

def detect_platform(url):
    """Deteksi platform dari URL"""
    if 'tiktok.com' in url:
        return 'TikTok'
    elif 'instagram.com' in url:
        return 'Instagram'
    elif 'threads.net' in url:
        return 'Threads'
    return 'Unknown'

def get_video_info(url):
    """Extract video info menggunakan yt-dlp"""
    
    ydl_opts = {
        'format': 'best',
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        'nocheckcertificate': True,
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        # Untuk Instagram - hapus jika tidak diperlukan
        'username': 'oauth2',
        'password': '',
        # Timeout settings
        'socket_timeout': 30,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # Extract data yang diperlukan
            video_data = {
                'success': True,
                'title': info.get('title', 'Unknown'),
                'duration': info.get('duration', 0),
                'thumbnail': info.get('thumbnail', ''),
                'uploader': info.get('uploader', 'Unknown'),
                'view_count': info.get('view_count', 0),
                'like_count': info.get('like_count', 0),
                'description': info.get('description', '')[:200] if info.get('description') else '',
                'formats': [],
                'platform': detect_platform(url)
            }
            
            # Extract available formats
            if 'formats' in info:
                for fmt in info['formats']:
                    # Filter hanya video (bukan audio only)
                    if fmt.get('vcodec') != 'none' and fmt.get('url'):
                        format_info = {
                            'format_id': fmt.get('format_id'),
                            'quality': fmt.get('format_note', 'unknown'),
                            'ext': fmt.get('ext', 'mp4'),
                            'filesize': fmt.get('filesize', 0),
                            'url': fmt.get('url'),
                            'width': fmt.get('width', 0),
                            'height': fmt.get('height', 0),
                        }
                        video_data['formats'].append(format_info)
            
            # Ambil URL download langsung (best quality)
            if 'url' in info:
                video_data['downloadUrl'] = info['url']
            elif video_data['formats']:
                # Pilih format terbaik
                best_format = max(video_data['formats'], 
                                key=lambda x: (x['height'] or 0, x['filesize'] or 0))
                video_data['downloadUrl'] = best_format['url']
                video_data['quality'] = f"{best_format['height']}p" if best_format['height'] else 'HD'
            
            return video_data
            
    except yt_dlp.utils.DownloadError as e:
        logger.error(f"yt-dlp download error: {e}")
        return {
            'success': False,
            'error': 'Video tidak dapat diakses. Mungkin private atau sudah dihapus.'
        }
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return {
            'success': False,
            'error': f'Gagal memproses video: {str(e)}'
        }

def format_filesize(bytes_size):
    """Format filesize ke MB"""
    if not bytes_size:
        return 'Unknown'
    mb = bytes_size / (1024 * 1024)
    return f"{mb:.2f} MB"

# Route untuk health check
@app.route('/', methods=['GET'])
def index():
    return jsonify({
        'status': 'online',
        'message': 'Video Downloader API',
        'endpoints': {
            'POST /api/download': 'Download video from TikTok, Instagram, Threads'
        }
    }), 200

@app.route('/api/download', methods=['POST', 'OPTIONS'])
def download_video():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Validasi Content-Type
        if not request.is_json:
            return jsonify({
                'success': False,
                'error': 'Content-Type harus application/json'
            }), 400
        
        data = request.get_json()
        url = data.get('url', '').strip()
        
        if not url:
            return jsonify({
                'success': False,
                'error': 'URL tidak boleh kosong'
            }), 400
        
        # Validasi URL
        if not validate_url(url):
            return jsonify({
                'success': False,
                'error': 'URL tidak valid. Gunakan link dari TikTok, Instagram, atau Threads.'
            }), 400
        
        logger.info(f"Processing URL: {url}")
        
        # Get video info
        video_info = get_video_info(url)
        
        if not video_info['success']:
            return jsonify(video_info), 400
        
        # Format response
        response_data = {
            'success': True,
            'title': video_info['title'],
            'duration': video_info['duration'],
            'thumbnail': video_info['thumbnail'],
            'uploader': video_info['uploader'],
            'platform': video_info['platform'],
            'downloadUrl': video_info.get('downloadUrl', ''),
            'quality': video_info.get('quality', 'HD'),
            'view_count': video_info.get('view_count', 0),
            'like_count': video_info.get('like_count', 0),
        }
        
        logger.info(f"Successfully processed: {video_info['title']}")
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"Error in download_video: {e}")
        return jsonify({
            'success': False,
            'error': f'Terjadi kesalahan: {str(e)}'
        }), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint tidak ditemukan'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500
