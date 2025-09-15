import { expect, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import React from 'react';

// Make React available globally for JSX
global.React = React;

// Set up test environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

expect.extend(matchers);