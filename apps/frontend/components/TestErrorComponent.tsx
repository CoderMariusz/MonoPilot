// Test component with intentional TypeScript error
export interface TestProps {
  id: string;
  name: string;
  count: number;
}

// This has a type error - missing 'count' property
const TestComponent: React.FC<TestProps> = (props) => {
  const data: TestProps = {
    id: '1',
    name: 'Test'
    // Missing 'count' - should be caught!
  };
  
  return <div>{data.name}</div>;
};

export default TestComponent;

