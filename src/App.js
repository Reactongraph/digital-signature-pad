import React, { useRef, useState, useLayoutEffect } from 'react';

/**
 * Digital Signature Pad Component
 * A simple signature pad with admin/client roles that controls who can sign.
 * @returns {JSX.Element} The signature pad component
 */
function SignaturePad() {
  // Canvas references
  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  // State management
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentUser, setCurrentUser] = useState('admin'); // 'admin' or 'client'
  const [signatureStatus, setSignatureStatus] = useState('not_signed'); // 'not_signed', 'requested', 'signed'
  const [padActive, setPadActive] = useState(false);
  const [fileFormat] = useState('png');

  /**
   * Initialize canvas and set up resize handler
   */
  useLayoutEffect(() => {
    if (!canvasRef.current) return;

    const setupCanvas = (canvas, ctx) => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      ctx.scale(ratio, ratio);
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
    };

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    setupCanvas(canvas, ctx);
    contextRef.current = ctx;

    const handleResize = () => {
      const prevImage = canvas.toDataURL();
      const ctx = contextRef.current;
      setupCanvas(canvas, ctx);

      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = prevImage;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /**
   * Get pointer coordinates relative to canvas
   * @param {Event} e - Mouse or touch event
   * @returns {Object} Coordinates object with x and y properties
   */
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    if (e.touches) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  /**
   * Check if drawing is allowed based on current state
   * @returns {boolean} Whether drawing is allowed
   */
  const canDraw = () => {
    return currentUser === 'client' && padActive;
  };

  /**
   * Start drawing on the canvas
   * @param {Event} e - Mouse or touch event
   */
  const startDrawing = (e) => {
    if (!canDraw()) return;

    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    const ctx = contextRef.current;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  /**
   * Continue drawing on the canvas
   * @param {Event} e - Mouse or touch event
   */
  const draw = (e) => {
    if (!isDrawing || !canDraw()) return;

    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = contextRef.current;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  /**
   * End drawing on the canvas
   * @param {Event} e - Mouse or touch event
   */
  const stopDrawing = (e) => {
    if (!isDrawing) return;

    e.preventDefault();
    setIsDrawing(false);
    contextRef.current.closePath();
  };

  /**
   * Clear the canvas
   */
  const clearCanvas = () => {
    if (!canvasRef.current || !contextRef.current) return;

    const canvas = canvasRef.current;
    contextRef.current.clearRect(0, 0, canvas.width, canvas.height);

    // Reset signature status if it was previously signed
    if (signatureStatus === 'signed') {
      setSignatureStatus('not_signed');
    }
  };

  /**
   * Download the signature as an image file
   */
  const downloadSignature = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL(`image/${fileFormat}`);

    // Create and trigger download link
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `signature.${fileFormat}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Request a signature from the client
   */
  const requestSignature = () => {
    if (currentUser !== 'admin') return;

    clearCanvas();
    setSignatureStatus('requested');
    setPadActive(true);
    setCurrentUser('client');
  };

  /**
   * Complete the signature process
   */
  const completeSignature = () => {
    if (currentUser !== 'client') return;

    setSignatureStatus('signed');
    setPadActive(false);
    setCurrentUser('admin');
  };

  /**
   * Toggle between admin and client roles
   */
  const toggleUser = () => {
    setCurrentUser(currentUser === 'admin' ? 'client' : 'admin');
  };

  /**
   * Get status indicator color based on current status
   * @returns {string} CSS color value
   */
  const getStatusColor = () => {
    switch (signatureStatus) {
      case 'signed':
        return '#4caf50';
      case 'requested':
        return '#ff9800';
      default:
        return '#9e9e9e';
    }
  };

  /**
   * Get status text based on current status
   * @returns {string} Status text
   */
  const getStatusText = () => {
    switch (signatureStatus) {
      case 'signed':
        return 'Signed';
      case 'requested':
        return 'Waiting for signature';
      default:
        return 'Not signed';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleContainer}>
          <span style={styles.penIcon}>🖊️</span>
          <h1 style={styles.title}>Digital Signature Pad</h1>
        </div>

        <div style={styles.userControls}>
          <button onClick={toggleUser} style={styles.userToggle}>
            {currentUser === 'admin' ? '👨‍💼 Admin' : '👤 Client'}
          </button>

          {currentUser === 'admin' && (
            <button
              onClick={requestSignature}
              style={styles.requestButton}
              disabled={signatureStatus === 'signed'}
            >
              Request Signature
            </button>
          )}

          {currentUser === 'client' && signatureStatus === 'requested' && (
            <button onClick={completeSignature} style={styles.completeButton}>
              Complete
            </button>
          )}
        </div>
      </div>

      <div style={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          style={styles.canvas}
          onMouseDown={startDrawing}
          onTouchStart={startDrawing}
          onMouseMove={draw}
          onTouchMove={draw}
          onMouseUp={stopDrawing}
          onTouchEnd={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>

      <div style={styles.buttonContainer}>
        <button onClick={clearCanvas} style={styles.clearButton}>
          <span role="img" aria-label="Clear">
            ✏️
          </span>{' '}
          Clear
        </button>

        <div style={styles.downloadGroup}>
          <button onClick={downloadSignature} style={styles.downloadButton}>
            <span role="img" aria-label="Download">
              💾
            </span>{' '}
            Download
          </button>
        </div>
      </div>

      <div style={styles.statusBar}>
        <div style={styles.statusIndicator}>
          <span
            style={{
              ...styles.statusDot,
              backgroundColor: getStatusColor(),
            }}
          ></span>
          <span>{getStatusText()}</span>
        </div>
      </div>
    </div>
  );
}

// Component styles
const styles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  penIcon: {
    fontSize: '24px',
    marginRight: '10px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: 0,
    color: '#333',
  },
  userControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  userToggle: {
    padding: '6px 12px',
    background: '#f8f8f8',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  requestButton: {
    padding: '6px 12px',
    background: '#e3f2fd',
    border: '1px solid #bbdefb',
    borderRadius: '4px',
    color: '#1976d2',
    cursor: 'pointer',
    fontSize: '14px',
  },
  completeButton: {
    padding: '6px 12px',
    background: '#e8f5e9',
    border: '1px solid #c8e6c9',
    borderRadius: '4px',
    color: '#2e7d32',
    cursor: 'pointer',
    fontSize: '14px',
  },
  canvasContainer: {
    border: '1px solid #ddd',
    borderRadius: '4px',
    overflow: 'hidden',
    height: '300px',
    marginBottom: '15px',
  },
  canvas: {
    width: '100%',
    height: '100%',
    touchAction: 'none',
    display: 'block',
    background: '#fff',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearButton: {
    padding: '8px 15px',
    background: '#f5f5f5',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '14px',
  },
  downloadGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  formatSelect: {
    padding: '8px',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    background: '#fff',
    fontSize: '14px',
  },
  downloadButton: {
    padding: '8px 15px',
    background: '#f5f5f5',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '14px',
  },
  statusBar: {
    marginTop: '15px',
    padding: '10px',
    background: '#f9f9f9',
    borderRadius: '4px',
    fontSize: '14px',
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
};

const App = SignaturePad;
export default App;
