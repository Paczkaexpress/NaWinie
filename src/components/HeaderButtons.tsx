import { Button } from './ui/button';

export default function HeaderButtons() {
  return (
    <>
      <Button variant="ghost" className="hidden md:inline-flex">
        Sign In
      </Button>
      <Button>
        Get Started
      </Button>
    </>
  );
} 