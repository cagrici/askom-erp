import React, { useEffect, useRef } from 'react';

interface CKEditorProps {
  value: string;
  onChange: (data: string) => void;
  config?: any;
}

const CKEditor: React.FC<CKEditorProps> = ({ value, onChange, config = {} }) => {
  const editorRef = useRef<any>();
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if CKEditor is already loaded
    if (typeof window.ClassicEditor !== 'undefined') {
      initEditor();
    } else {
      // Load CKEditor script if not already loaded
      const script = document.createElement('script');
      script.src = 'https://cdn.ckeditor.com/ckeditor5/36.0.0/classic/ckeditor.js';
      script.async = true;
      script.onload = initEditor;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }

    // Cleanup
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
      }
    };
  }, []);

  // Update editor content when value prop changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.getData() !== value) {
      editorRef.current.setData(value);
    }
  }, [value]);

  const initEditor = async () => {
    if (!elementRef.current) return;

    try {
      // Default configuration
      const defaultConfig = {
        toolbar: [
          'heading',
          '|',
          'bold',
          'italic',
          'link',
          'bulletedList',
          'numberedList',
          '|',
          'indent',
          'outdent',
          '|',
          'blockQuote',
          'insertTable',
          'undo',
          'redo',
        ],
        language: 'tr',
      };

      // Merge default config with user config
      const editorConfig = { ...defaultConfig, ...config };

      // Initialize CKEditor
      const editor = await window.ClassicEditor.create(elementRef.current, editorConfig);

      // Store editor reference
      editorRef.current = editor;

      // Set initial data
      editor.setData(value);

      // Set up event handlers
      editor.model.document.on('change:data', () => {
        const data = editor.getData();
        onChange(data);
      });
    } catch (error) {
      console.error('CKEditor initialization failed:', error);
    }
  };

  return <div ref={elementRef} />;
};

export default CKEditor;

// Extend Window interface to include CKEditor
declare global {
  interface Window {
    ClassicEditor: any;
  }
}
