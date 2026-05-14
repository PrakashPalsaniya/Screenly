import { useState } from "react";

const ProgressiveImg = ({ src, srcSet, sizes, alt, className, containerClassName, eager }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden ${containerClassName || ''}`}>
      {!isLoaded && (
        <div className="absolute inset-0 z-0 animate-pulse bg-gray-200" />
      )}
      
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        className={`${className} relative z-10 transition-opacity duration-500 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
};

export default ProgressiveImg;
