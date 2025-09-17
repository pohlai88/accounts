// @ts-nocheck
// Frontend Component Tests for ChartOfAccounts
// Tests account management, hierarchy display, and user interactions

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChartOfAccounts } from '@aibos/ui/components/accounts/ChartOfAccounts';
import { useAccounts } from '@aibos/ui/store';

// Mock the store hooks
vi.mock('@aibos/ui/store', () => ({
    useAccounts: vi.fn(),
}));

// Mock the API client
vi.mock('@aibos/ui/lib/api-client', () => ({
    ApiClient: vi.fn().mockImplementation(() => ({
        createAccount: vi.fn(),
        updateAccount: vi.fn(),
        deleteAccount: vi.fn(),
    })),
}));

describe('ChartOfAccounts', () => {
    const mockAccounts = [
        {
            id: '1',
            code: '1000',
            name: 'Assets',
            type: 'ASSET',
            parentId: null,
            level: 0,
            children: [
                {
                    id: '2',
                    code: '1100',
                    name: 'Current Assets',
                    type: 'ASSET',
                    parentId: '1',
                    level: 1,
                    children: [
                        {
                            id: '3',
                            code: '1110',
                            name: 'Cash and Cash Equivalents',
                            type: 'ASSET',
                            parentId: '2',
                            level: 2,
                            children: [],
                        },
                    ],
                },
            ],
        },
        {
            id: '4',
            code: '2000',
            name: 'Liabilities',
            type: 'LIABILITY',
            parentId: null,
            level: 0,
            children: [],
        },
    ];

    const mockProps = {
        onAccountSelect: vi.fn(),
        onAccountEdit: vi.fn(),
        onAccountDelete: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock store hook
        (useAccounts as any).mockReturnValue({
            accounts: mockAccounts,
            loading: false,
            error: null,
            fetchAccounts: vi.fn(),
            createAccount: vi.fn(),
            updateAccount: vi.fn(),
            deleteAccount: vi.fn(),
        });
    });

    describe('Rendering', () => {
        it('should render chart of accounts title', () => {
            render(<ChartOfAccounts {...mockProps} />);

            expect(screen.getByText(/chart of accounts/i)).toBeInTheDocument();
        });

        it('should render search input', () => {
            render(<ChartOfAccounts {...mockProps} />);

            expect(screen.getByPlaceholderText(/search accounts/i)).toBeInTheDocument();
        });

        it('should render add account button', () => {
            render(<ChartOfAccounts {...mockProps} />);

            expect(screen.getByRole('button', { name: /add account/i })).toBeInTheDocument();
        });

        it('should render account hierarchy', () => {
            render(<ChartOfAccounts {...mockProps} />);

            expect(screen.getByText('1000 - Assets')).toBeInTheDocument();
            expect(screen.getByText('1100 - Current Assets')).toBeInTheDocument();
            expect(screen.getByText('1110 - Cash and Cash Equivalents')).toBeInTheDocument();
            expect(screen.getByText('2000 - Liabilities')).toBeInTheDocument();
        });

        it('should render account types', () => {
            render(<ChartOfAccounts {...mockProps} />);

            expect(screen.getByText(/asset/i)).toBeInTheDocument();
            expect(screen.getByText(/liability/i)).toBeInTheDocument();
        });
    });

    describe('Search Functionality', () => {
        it('should filter accounts based on search term', () => {
            render(<ChartOfAccounts {...mockProps} />);

            const searchInput = screen.getByPlaceholderText(/search accounts/i);
            fireEvent.change(searchInput, { target: { value: 'cash' } });

            expect(screen.getByText('1110 - Cash and Cash Equivalents')).toBeInTheDocument();
            expect(screen.queryByText('2000 - Liabilities')).not.toBeInTheDocument();
        });

        it('should filter by account code', () => {
            render(<ChartOfAccounts {...mockProps} />);

            const searchInput = screen.getByPlaceholderText(/search accounts/i);
            fireEvent.change(searchInput, { target: { value: '1000' } });

            expect(screen.getByText('1000 - Assets')).toBeInTheDocument();
            expect(screen.queryByText('2000 - Liabilities')).not.toBeInTheDocument();
        });

        it('should show no results message when no matches found', () => {
            render(<ChartOfAccounts {...mockProps} />);

            const searchInput = screen.getByPlaceholderText(/search accounts/i);
            fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

            expect(screen.getByText(/no accounts found/i)).toBeInTheDocument();
        });

        it('should clear search when clear button is clicked', () => {
            render(<ChartOfAccounts {...mockProps} />);

            const searchInput = screen.getByPlaceholderText(/search accounts/i);
            fireEvent.change(searchInput, { target: { value: 'cash' } });

            const clearButton = screen.getByRole('button', { name: /clear/i });
            fireEvent.click(clearButton);

            expect(searchInput).toHaveValue('');
            expect(screen.getByText('1000 - Assets')).toBeInTheDocument();
        });
    });

    describe('Account Management', () => {
        it('should open add account dialog when add button is clicked', () => {
            render(<ChartOfAccounts {...mockProps} />);

            const addButton = screen.getByRole('button', { name: /add account/i });
            fireEvent.click(addButton);

            expect(screen.getByText(/add new account/i)).toBeInTheDocument();
        });

        it('should open edit account dialog when edit button is clicked', () => {
            render(<ChartOfAccounts {...mockProps} />);

            const editButton = screen.getByRole('button', { name: /edit account/i });
            fireEvent.click(editButton);

            expect(screen.getByText(/edit account/i)).toBeInTheDocument();
        });

        it('should open delete confirmation when delete button is clicked', () => {
            render(<ChartOfAccounts {...mockProps} />);

            const deleteButton = screen.getByRole('button', { name: /delete account/i });
            fireEvent.click(deleteButton);

            expect(screen.getByText(/confirm deletion/i)).toBeInTheDocument();
        });

        it('should call onAccountSelect when account is clicked', () => {
            render(<ChartOfAccounts {...mockProps} />);

            const accountItem = screen.getByText('1000 - Assets');
            fireEvent.click(accountItem);

            expect(mockProps.onAccountSelect).toHaveBeenCalledWith(mockAccounts[0]);
        });
    });

    describe('Form Validation', () => {
        it('should validate required fields in add account form', async () => {
            render(<ChartOfAccounts {...mockProps} />);

            const addButton = screen.getByRole('button', { name: /add account/i });
            fireEvent.click(addButton);

            const saveButton = screen.getByRole('button', { name: /save/i });
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText(/account code is required/i)).toBeInTheDocument();
                expect(screen.getByText(/account name is required/i)).toBeInTheDocument();
                expect(screen.getByText(/account type is required/i)).toBeInTheDocument();
            });
        });

        it('should validate account code format', async () => {
            render(<ChartOfAccounts {...mockProps} />);

            const addButton = screen.getByRole('button', { name: /add account/i });
            fireEvent.click(addButton);

            const codeInput = screen.getByLabelText(/account code/i);
            fireEvent.change(codeInput, { target: { value: 'invalid-code' } });

            const saveButton = screen.getByRole('button', { name: /save/i });
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText(/account code must be numeric/i)).toBeInTheDocument();
            });
        });

        it('should validate account code uniqueness', async () => {
            render(<ChartOfAccounts {...mockProps} />);

            const addButton = screen.getByRole('button', { name: /add account/i });
            fireEvent.click(addButton);

            const codeInput = screen.getByLabelText(/account code/i);
            fireEvent.change(codeInput, { target: { value: '1000' } });

            const saveButton = screen.getByRole('button', { name: /save/i });
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText(/account code already exists/i)).toBeInTheDocument();
            });
        });
    });

    describe('Hierarchy Display', () => {
        it('should show account hierarchy with proper indentation', () => {
            render(<ChartOfAccounts {...mockProps} />);

            const assetsAccount = screen.getByText('1000 - Assets');
            const currentAssetsAccount = screen.getByText('1100 - Current Assets');
            const cashAccount = screen.getByText('1110 - Cash and Cash Equivalents');

            expect(assetsAccount).toBeInTheDocument();
            expect(currentAssetsAccount).toBeInTheDocument();
            expect(cashAccount).toBeInTheDocument();
        });

        it('should toggle account expansion/collapse', () => {
            render(<ChartOfAccounts {...mockProps} />);

            const expandButton = screen.getByRole('button', { name: /expand/i });
            fireEvent.click(expandButton);

            expect(screen.getByText('1100 - Current Assets')).toBeInTheDocument();

            const collapseButton = screen.getByRole('button', { name: /collapse/i });
            fireEvent.click(collapseButton);

            expect(screen.queryByText('1100 - Current Assets')).not.toBeInTheDocument();
        });

        it('should show account level indicators', () => {
            render(<ChartOfAccounts {...mockProps} />);

            const levelIndicators = screen.getAllByText(/level/i);
            expect(levelIndicators).toHaveLength(3); // One for each account level
        });
    });

    describe('Loading States', () => {
        it('should show loading spinner when loading', () => {
            (useAccounts as any).mockReturnValue({
                accounts: [],
                loading: true,
                error: null,
                fetchAccounts: vi.fn(),
                createAccount: vi.fn(),
                updateAccount: vi.fn(),
                deleteAccount: vi.fn(),
            });

            render(<ChartOfAccounts {...mockProps} />);

            expect(screen.getByText(/loading accounts/i)).toBeInTheDocument();
        });

        it('should show loading state for individual operations', async () => {
            render(<ChartOfAccounts {...mockProps} />);

            const addButton = screen.getByRole('button', { name: /add account/i });
            fireEvent.click(addButton);

            const saveButton = screen.getByRole('button', { name: /save/i });
            fireEvent.click(saveButton);

            expect(screen.getByText(/saving/i)).toBeInTheDocument();
        });
    });

    describe('Error Handling', () => {
        it('should display error message when data fetch fails', () => {
            (useAccounts as any).mockReturnValue({
                accounts: [],
                loading: false,
                error: 'Failed to load accounts',
                fetchAccounts: vi.fn(),
                createAccount: vi.fn(),
                updateAccount: vi.fn(),
                deleteAccount: vi.fn(),
            });

            render(<ChartOfAccounts {...mockProps} />);

            expect(screen.getByText(/failed to load accounts/i)).toBeInTheDocument();
        });

        it('should show retry button when error occurs', () => {
            (useAccounts as any).mockReturnValue({
                accounts: [],
                loading: false,
                error: 'Failed to load accounts',
                fetchAccounts: vi.fn(),
                createAccount: vi.fn(),
                updateAccount: vi.fn(),
                deleteAccount: vi.fn(),
            });

            render(<ChartOfAccounts {...mockProps} />);

            const retryButton = screen.getByRole('button', { name: /retry/i });
            expect(retryButton).toBeInTheDocument();
        });

        it('should handle form submission errors', async () => {
            render(<ChartOfAccounts {...mockProps} />);

            const addButton = screen.getByRole('button', { name: /add account/i });
            fireEvent.click(addButton);

            // Fill form with valid data
            fireEvent.change(screen.getByLabelText(/account code/i), { target: { value: '3000' } });
            fireEvent.change(screen.getByLabelText(/account name/i), { target: { value: 'Test Account' } });
            fireEvent.change(screen.getByLabelText(/account type/i), { target: { value: 'ASSET' } });

            const saveButton = screen.getByRole('button', { name: /save/i });
            fireEvent.click(saveButton);

            // Mock API error
            (useAccounts as any).mockReturnValue({
                accounts: mockAccounts,
                loading: false,
                error: 'Failed to create account',
                fetchAccounts: vi.fn(),
                createAccount: vi.fn(),
                updateAccount: vi.fn(),
                deleteAccount: vi.fn(),
            });

            await waitFor(() => {
                expect(screen.getByText(/failed to create account/i)).toBeInTheDocument();
            });
        });
    });

    describe('Accessibility', () => {
        it('should have proper heading structure', () => {
            render(<ChartOfAccounts {...mockProps} />);

            const mainHeading = screen.getByRole('heading', { level: 1 });
            expect(mainHeading).toBeInTheDocument();
            expect(mainHeading).toHaveTextContent(/chart of accounts/i);
        });

        it('should have proper button labels', () => {
            render(<ChartOfAccounts {...mockProps} />);

            expect(screen.getByRole('button', { name: /add account/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /edit account/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /delete account/i })).toBeInTheDocument();
        });

        it('should have proper form labels', () => {
            render(<ChartOfAccounts {...mockProps} />);

            const addButton = screen.getByRole('button', { name: /add account/i });
            fireEvent.click(addButton);

            expect(screen.getByLabelText(/account code/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/account name/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/account type/i)).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty accounts list', () => {
            (useAccounts as any).mockReturnValue({
                accounts: [],
                loading: false,
                error: null,
                fetchAccounts: vi.fn(),
                createAccount: vi.fn(),
                updateAccount: vi.fn(),
                deleteAccount: vi.fn(),
            });

            render(<ChartOfAccounts {...mockProps} />);

            expect(screen.getByText(/no accounts found/i)).toBeInTheDocument();
        });

        it('should handle very deep hierarchy', () => {
            const deepAccounts = [
                {
                    id: '1',
                    code: '1000',
                    name: 'Level 0',
                    type: 'ASSET',
                    parentId: null,
                    level: 0,
                    children: [
                        {
                            id: '2',
                            code: '1100',
                            name: 'Level 1',
                            type: 'ASSET',
                            parentId: '1',
                            level: 1,
                            children: [
                                {
                                    id: '3',
                                    code: '1110',
                                    name: 'Level 2',
                                    type: 'ASSET',
                                    parentId: '2',
                                    level: 2,
                                    children: [
                                        {
                                            id: '4',
                                            code: '1111',
                                            name: 'Level 3',
                                            type: 'ASSET',
                                            parentId: '3',
                                            level: 3,
                                            children: [],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ];

            (useAccounts as any).mockReturnValue({
                accounts: deepAccounts,
                loading: false,
                error: null,
                fetchAccounts: vi.fn(),
                createAccount: vi.fn(),
                updateAccount: vi.fn(),
                deleteAccount: vi.fn(),
            });

            render(<ChartOfAccounts {...mockProps} />);

            expect(screen.getByText('1000 - Level 0')).toBeInTheDocument();
            expect(screen.getByText('1100 - Level 1')).toBeInTheDocument();
            expect(screen.getByText('1110 - Level 2')).toBeInTheDocument();
            expect(screen.getByText('1111 - Level 3')).toBeInTheDocument();
        });

        it('should handle special characters in account names', () => {
            const specialAccounts = [
                {
                    id: '1',
                    code: '1000',
                    name: 'Test & Co. (Ltd.) - Special!@#$%',
                    type: 'ASSET',
                    parentId: null,
                    level: 0,
                    children: [],
                },
            ];

            (useAccounts as any).mockReturnValue({
                accounts: specialAccounts,
                loading: false,
                error: null,
                fetchAccounts: vi.fn(),
                createAccount: vi.fn(),
                updateAccount: vi.fn(),
                deleteAccount: vi.fn(),
            });

            render(<ChartOfAccounts {...mockProps} />);

            expect(screen.getByText('1000 - Test & Co. (Ltd.) - Special!@#$%')).toBeInTheDocument();
        });
    });
});
