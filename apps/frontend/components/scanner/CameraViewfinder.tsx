/**
 * Camera Viewfinder Component
 * Story 1.7.1 - Single-Screen Scanner (Variant B)
 *
 * Always-on camera viewfinder with barcode scanning overlay guide.
 * Targets <1s camera start time (p95), auto-requests permissions.
 *
 * @component CameraViewfinder
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { AlertTriangle, Camera } from 'lucide-react';

interface CameraViewfinderProps {
  onScan: (barcode: string) => void;
  onCameraError?: (error: string) => void;
  onCameraReady?: () => void;
  className?: string;
  /** Debounce time in ms to prevent duplicate scans (default: 300ms) */
  debounceMs?: number;
}

export default function CameraViewfinder({
  onScan,
  onCameraError,
  onCameraReady,
  className = '',
  debounceMs = 300,
}: CameraViewfinderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const lastScanRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const [cameraStatus, setCameraStatus] = useState<'initializing' | 'ready' | 'error'>('initializing');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    let controls: any = null;

    const initializeCamera = async () => {
      startTimeRef.current = Date.now();

      try {
        // Configure barcode reader (supports multiple formats by default)
        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;

        // Request camera access
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();

        if (devices.length === 0) {
          throw new Error('No camera devices found');
        }

        // Use back camera if available (better for scanning)
        const backCamera = devices.find(device =>
          device.label.toLowerCase().includes('back') ||
          device.label.toLowerCase().includes('rear')
        );
        const selectedDevice = backCamera || devices[0];

        if (!videoRef.current) return;

        // Start continuous decode from video device
        controls = await reader.decodeFromVideoDevice(
          selectedDevice.deviceId,
          videoRef.current,
          (result, error) => {
            if (!isMounted) return;

            if (result) {
              const barcode = result.getText();
              const now = Date.now();

              // Debounce: prevent duplicate scans within debounceMs
              if (
                barcode !== lastScanRef.current ||
                now - lastScanTimeRef.current > debounceMs
              ) {
                lastScanRef.current = barcode;
                lastScanTimeRef.current = now;
                onScan(barcode);
              }
            }

            // Log decode errors (but don't show to user - continuous scanning)
            if (error && !(error.name === 'NotFoundException')) {
              console.debug('Barcode decode error:', error.message);
            }
          }
        );

        if (isMounted) {
          const startupTime = Date.now() - startTimeRef.current;
          console.log(`[CameraViewfinder] Camera started in ${startupTime}ms`);

          setCameraStatus('ready');
          onCameraReady?.();
        }
      } catch (err: any) {
        console.error('[CameraViewfinder] Camera initialization error:', err);

        if (!isMounted) return;

        // Check for permission denied
        if (
          err.name === 'NotAllowedError' ||
          err.name === 'PermissionDeniedError' ||
          err.message?.includes('Permission denied')
        ) {
          setPermissionDenied(true);
          setErrorMessage('Camera permission denied. Please enable camera access in your browser settings.');
          onCameraError?.('permission_denied');
        } else if (err.name === 'NotFoundError' || err.message?.includes('No camera')) {
          setErrorMessage('No camera found. Please connect a camera or use manual entry mode.');
          onCameraError?.('no_camera');
        } else {
          setErrorMessage(`Camera error: ${err.message || 'Unknown error'}`);
          onCameraError?.('camera_error');
        }

        setCameraStatus('error');
      }
    };

    initializeCamera();

    // Cleanup
    return () => {
      isMounted = false;
      if (controls) {
        controls.stop();
      }
    };
  }, [onScan, onCameraError, onCameraReady, debounceMs]);

  return (
    <div className={`relative bg-black overflow-hidden ${className}`}>
      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
      />

      {/* Barcode overlay guide (green box) */}
      {cameraStatus === 'ready' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[60%] h-[40%] border-4 border-green-500 rounded-lg shadow-lg">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded text-sm font-medium">
              Point at barcode
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {cameraStatus === 'initializing' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 text-white">
          <Camera className="w-12 h-12 mb-3 animate-pulse" />
          <p className="text-sm">Starting camera...</p>
        </div>
      )}

      {/* Error state */}
      {cameraStatus === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-90 text-white p-4">
          <AlertTriangle className="w-12 h-12 mb-3 text-red-500" />
          <p className="text-sm text-center mb-4">{errorMessage}</p>

          {permissionDenied && (
            <div className="text-xs text-gray-400 text-center max-w-sm">
              <p className="mb-2">To enable camera:</p>
              <ol className="list-decimal list-inside text-left space-y-1">
                <li>Click the camera icon in your browser's address bar</li>
                <li>Select "Allow" for camera access</li>
                <li>Refresh this page</li>
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Camera start time metric (dev only) */}
      {process.env.NODE_ENV === 'development' && cameraStatus === 'ready' && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          {Date.now() - startTimeRef.current}ms
        </div>
      )}
    </div>
  );
}
