import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle, Loader2, RotateCcw } from 'lucide-react';
import { resolveMediaUrl, getEmbedVideoUrl, isEmbedVideo } from '../utils/videoUtils';

const VideoPlayerModal = ({ video, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const videoRef = useRef(null);

  const videoSrc = video
    ? resolveMediaUrl(
        video.videoUrl || (video._id ? `/api/v1/video-testimonials/${video._id}/video` : '')
      )
    : '';
  const isEmbed = video ? isEmbedVideo(video.videoUrl) : false;

  useEffect(() => {
    return () => {
      if (videoRef.current) {
        try {
          videoRef.current.pause();
          videoRef.current.removeAttribute('src');
          videoRef.current.load();
        } catch (_) {}
      }
    };
  }, []);

  useEffect(() => {
    if (!video) return;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [video]);

  const handleClose = () => {
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      } catch (_) {}
    }
    onClose();
  };

  const handleRetry = () => {
    setError(false);
    setLoading(true);
    setRetryKey((k) => k + 1);
  };

  if (!video) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto overscroll-contain transition-opacity duration-200"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-video-modal-title"
    >
      <div
        className="bg-navy-deep text-white rounded-lg sm:rounded-xl overflow-hidden w-full max-w-[1000px] max-h-[90dvh] shadow-overlay border border-white/10 relative flex flex-col my-auto transition-transform duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-white/10 bg-navy-deep shrink-0">
          <div className="min-w-0 pr-3">
            <h3
              id="admin-video-modal-title"
              className="text-white font-bold text-sm sm:text-base leading-snug truncate"
            >
              {video.studentName || 'Student Story'} — Video Testimonial Preview
            </h3>
            {(video.designation || video.courseName) && (
              <p className="text-xs text-white/60 truncate mt-0.5">
                {[video.designation, video.courseName].filter(Boolean).join(' • ')}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain flex flex-col bg-black/40">
          <div className="relative w-full bg-black flex items-center justify-center shrink-0 aspect-video max-h-[calc(90dvh-120px)] overflow-hidden">
            {loading && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 text-white gap-2 pointer-events-none">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
                <span className="text-xs text-white/70 font-medium">Loading video stream...</span>
              </div>
            )}

            {error ? (
              <div className="flex flex-col items-center justify-center p-6 text-center text-white gap-3 z-20">
                <AlertCircle className="w-10 h-10 text-[#fca5a5]" />
                <p className="text-sm font-semibold">Video Playback Error</p>
                <p className="text-xs text-white/60 max-w-sm">
                  Unable to load this video stream. Please retry or verify your network connection.
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F4D36B] hover:bg-[#ebd068] text-[#102747] font-bold text-xs shadow-sm transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry Playback</span>
                  </button>
                  {videoSrc && (
                    <a
                      href={videoSrc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-white/70 hover:text-white underline underline-offset-4"
                    >
                      Open Direct Stream
                    </a>
                  )}
                </div>
              </div>
            ) : isEmbed ? (
              <iframe
                key={`embed-${video._id || video.videoUrl}-${retryKey}`}
                src={getEmbedVideoUrl(video.videoUrl)}
                title={`${video.studentName || 'Student'} Testimonial Video`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                onLoad={() => setLoading(false)}
              />
            ) : (
              <video
                ref={videoRef}
                key={`stream-${video._id || video.videoUrl}-${retryKey}`}
                src={videoSrc}
                controls
                autoPlay
                playsInline
                preload="metadata"
                className="w-full h-full object-contain bg-black"
                onLoadedData={() => setLoading(false)}
                onCanPlay={() => setLoading(false)}
                onError={(e) => {
                  console.error('Video playback error:', e);
                  setLoading(false);
                  setError(true);
                }}
              >
                Your browser does not support HTML5 video playback.
              </video>
            )}
          </div>

          {video.description && (
            <div className="px-4 sm:px-6 py-4 bg-navy-deep text-xs sm:text-sm text-white/80 border-t border-white/10 shrink-0">
              <div className="font-semibold text-white/60 mb-1 text-[11px] uppercase tracking-wider">
                Student Review & Experience
              </div>
              <p className="leading-relaxed whitespace-pre-line text-white/80">
                {video.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

export default VideoPlayerModal;
