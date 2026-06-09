import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotificationHub from '../NotificationHub';
import { AuthProvider } from '../../../context/AuthContext';

// Mock the external hooks and Firebase services
jest.mock('../../../context/AuthContext', () => ({
 useAuth: () => ({
 user: { uid: 'test-user-123' },
 }),
 AuthProvider: ({ children }) => <div>{children}</div>
}));

jest.mock('../../../firebase/config', () => ({
 db: {}
}));

jest.mock('firebase/firestore', () => ({
 collection: jest.fn(),
 query: jest.fn(),
 where: jest.fn(),
 orderBy: jest.fn(),
 onSnapshot: jest.fn((query, callback) => {
 // Simulate incoming data
 callback({
 docs: [
 { id: 'notif-1', data: () => ({ message: 'New Episode Aired', readBy: [] }) },
 { id: 'notif-2', data: () => ({ message: 'Welcome to NeonToad', readBy: ['test-user-123'] }) }
 ]
 });
 return jest.fn(); // unsubscribe mock
 }),
 limit: jest.fn()
}));

describe('NotificationHub Component', () => {
 const mockOnToggle = jest.fn();

 beforeEach(() => {
 jest.clearAllMocks();
 });

 test('renders notification bell icon', () => {
 render(<NotificationHub isOpen={false} onToggle={mockOnToggle} />);
 // Check if the button exists
 const button = screen.getByRole('button');
 expect(button).toBeInTheDocument();
 });

 test('displays correct unread count badge', () => {
 render(<NotificationHub isOpen={false} onToggle={mockOnToggle} />);
 // Based on the mocked snapshot, 1 notification is unread
 expect(screen.getByText('1')).toBeInTheDocument();
 });

 test('opens dropdown when clicked', () => {
 render(<NotificationHub isOpen={false} onToggle={mockOnToggle} />);
 fireEvent.click(screen.getByRole('button'));
 expect(mockOnToggle).toHaveBeenCalledWith(true);
 });

 test('renders unread vs read notifications correctly in dropdown', () => {
 // Force open state for testing inner contents
 render(<NotificationHub isOpen={true} onToggle={mockOnToggle} />);
 
 expect(screen.getByText('New Episode Aired')).toBeInTheDocument();
 expect(screen.getByText('Welcome to NeonToad')).toBeInTheDocument();
 });
});
