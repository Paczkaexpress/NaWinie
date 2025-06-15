import React from 'react';

// Performance monitoring hook
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = React.useRef(0);
  const startTime = React.useRef(performance.now());

  React.useEffect(() => {
    renderCount.current += 1;
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;

    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered ${renderCount.current} times in ${renderTime.toFixed(2)}ms`);
    }

    startTime.current = performance.now();
  });

  return {
    renderCount: renderCount.current,
  };
};

// Memory leak prevention hook
export const useCleanup = (cleanupFn: () => void, deps: React.DependencyList = []) => {
  React.useEffect(() => {
    return cleanupFn;
  }, deps);
};

// Debounced value hook for performance
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttled callback hook
export const useThrottle = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T => {
  const throttling = React.useRef(false);

  return React.useCallback(
    ((...args: Parameters<T>) => {
      if (!throttling.current) {
        fn(...args);
        throttling.current = true;
        setTimeout(() => {
          throttling.current = false;
        }, delay);
      }
    }) as T,
    [fn, delay]
  );
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  ref: React.RefObject<HTMLElement>,
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [ref, options]);

  return isIntersecting;
};

// Virtual list component for large datasets
interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  getItemKey: (item: T, index: number) => string | number;
}

export const VirtualList = <T,>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  getItemKey,
}: VirtualListProps<T>) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length - 1
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);

  const handleScroll = useThrottle((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, 16); // ~60fps

  return (
    <div
      ref={containerRef}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map((item, index) => (
          <div
            key={getItemKey(item, startIndex + index)}
            style={{
              position: 'absolute',
              top: (startIndex + index) * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            {renderItem(item, startIndex + index)}
          </div>
        ))}
      </div>
    </div>
  );
};

// Image lazy loading component
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  placeholder?: string;
  threshold?: number;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjY2NjIi8+PC9zdmc+',
  threshold = 0.1,
  ...props
}) => {
  const [imageSrc, setImageSrc] = React.useState(placeholder);
  const [loading, setLoading] = React.useState(true);
  const imgRef = React.useRef<HTMLImageElement>(null);
  
  const isVisible = useIntersectionObserver(imgRef, { threshold });

  React.useEffect(() => {
    if (isVisible && imageSrc === placeholder) {
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setLoading(false);
      };
      img.onerror = () => {
        setLoading(false);
      };
      img.src = src;
    }
  }, [isVisible, src, imageSrc, placeholder]);

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      {...props}
      className={`${props.className || ''} ${loading ? 'animate-pulse bg-gray-200' : ''}`}
    />
  );
};

// Bundle size analyzer component (development only)
export const BundleAnalyzer: React.FC = () => {
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Log bundle information
      const scripts = Array.from(document.scripts);
      const totalSize = scripts.reduce((acc, script) => {
        if (script.src) {
          // This is a rough estimate - in production you'd use proper bundle analyzer
          return acc + script.src.length;
        }
        return acc;
      }, 0);

      console.group('Bundle Analysis');
      console.log(`Total script tags: ${scripts.length}`);
      console.log(`Estimated bundle size: ${(totalSize / 1024).toFixed(2)}KB`);
      console.groupEnd();
    }
  }, []);

  return null;
};

// React DevTools Profiler wrapper
interface ProfilerWrapperProps {
  id: string;
  children: React.ReactNode;
}

export const ProfilerWrapper: React.FC<ProfilerWrapperProps> = ({ id, children }) => {
  const onRenderCallback = React.useCallback(
    (
      profilerId: string,
      phase: 'mount' | 'update',
      actualDuration: number,
      baseDuration: number,
      startTime: number,
      commitTime: number
    ) => {
      if (process.env.NODE_ENV === 'development') {
        console.log({
          profilerId,
          phase,
          actualDuration,
          baseDuration,
          startTime,
          commitTime,
        });
      }
    },
    []
  );

  if (process.env.NODE_ENV === 'development') {
    return (
      <React.Profiler id={id} onRender={onRenderCallback}>
        {children}
      </React.Profiler>
    );
  }

  return <>{children}</>;
};

export default {
  usePerformanceMonitor,
  useCleanup,
  useDebounce,
  useThrottle,
  useIntersectionObserver,
  VirtualList,
  LazyImage,
  BundleAnalyzer,
  ProfilerWrapper,
}; 