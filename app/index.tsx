
import { Redirect } from 'expo-router';
import { useEffect } from 'react';

export default function Index() {
  useEffect(() => {
    console.log('Index screen mounted - redirecting to home');
  }, []);

  return <Redirect href="/(tabs)/(home)/" />;
}
