// Test file to verify pre-commit hook catches TypeScript errors
export interface Person {
  id: string;
  name: string;
  age: number;
}

// This intentionally has a type error - missing 'age' property
const person: Person = {
  id: '1',
  name: 'Test'
  // Missing 'age' - should be caught by pre-commit hook!
};

