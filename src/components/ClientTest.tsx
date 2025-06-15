import React, { useState, useEffect } from 'react';

export default function ClientTest() {
  const [isClient, setIsClient] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log('🔥 ClientTest: useEffect running - this should only happen on client side');
    setIsClient(true);
  }, []);

  const handleClick = () => {
    console.log('🔥 ClientTest: Button clicked');
    setCount(prev => prev + 1);
  };

  console.log('🔥 ClientTest: Component rendering, isClient:', isClient, 'count:', count);

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid blue', 
      margin: '10px',
      backgroundColor: isClient ? 'lightgreen' : 'lightcoral'
    }}>
      <h3>Client Test Component</h3>
      <p>Is Client: {isClient ? '✅ YES' : '❌ NO'}</p>
      <p>Count: {count}</p>
      <button onClick={handleClick} style={{ padding: '10px', fontSize: '16px' }}>
        Click me to test state updates
      </button>
      <p><small>If this is green and the button works, client-side React is working</small></p>
    </div>
  );
} 