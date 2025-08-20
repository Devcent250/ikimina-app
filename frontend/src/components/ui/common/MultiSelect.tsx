import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";

const MultiSelect = ({ 
    options = [], 
    value = [], 
    onChange, 
    placeholder = "Select options", 
    disabled = false, 
    error = null 
  }) => { 
    const [isOpen, setIsOpen] = useState(false); 
    const containerRef = useRef(null); 
    
    const selectedOptions = options.filter(option => value.includes(option.value));
    
    const handleOptionClick = (optionValue) => { 
      let newValue; 
      if (value.includes(optionValue)) { 
        // Remove option if already selected
        newValue = value.filter(v => v !== optionValue);
      } else {
        // Add option if not selected
        newValue = [...value, optionValue];
      }
      onChange(newValue);
    };
  
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (containerRef.current && !containerRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
  
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);
  
    return (
      <div ref={containerRef} className="relative">
        <div 
          className={`flex items-center justify-between rounded-md border border-input px-3 py-2 text-sm ring-offset-background 
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} 
            ${error ? 'border-red-500' : ''}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <div className="flex flex-wrap gap-1">
            {selectedOptions.length > 0 ? (
              selectedOptions.map(option => (
                <Badge key={option.value} variant="secondary" className="mr-1">
                  {option.label}
                  <span 
                    className="ml-1 cursor-pointer" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOptionClick(option.value);
                    }}
                  >
                    ×
                  </span>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={`h-4 w-4 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        
        {isOpen && (
          <div className="absolute mt-1 w-full z-10 max-h-60 overflow-auto rounded-md border bg-popover p-1 shadow-md">
            {options.map(option => (
              <div
                key={option.value}
                className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground
                  ${value.includes(option.value) ? 'bg-accent/50' : ''}`}
                onClick={() => handleOptionClick(option.value)}
              >
                <div className="mr-2 flex h-4 w-4 items-center justify-center rounded-sm border">
                  {value.includes(option.value) && (
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="24" 
                      height="24" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="h-3 w-3"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
                <span>{option.label}</span>
              </div>
            ))}
          </div>
        )}
        
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    );
  };

  export default MultiSelect;