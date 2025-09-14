import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TenantSwitcher, Tenant } from './tenant-switcher';

const mockTenants: Tenant[] = [
    {
        id: 'tenant-1',
        name: 'Acme Corp',
        slug: 'acme-corp',
        role: 'admin',
        permissions: {},
        company: {
            id: 'company-1',
            name: 'Acme Corporation',
            code: 'ACME'
        },
        isActive: true
    },
    {
        id: 'tenant-2',
        name: 'Beta Inc',
        slug: 'beta-inc',
        role: 'user',
        permissions: {},
        company: {
            id: 'company-2',
            name: 'Beta Industries',
            code: 'BETA'
        },
        isActive: false
    }
];

describe('TenantSwitcher', () => {
    it('should render with active tenant', () => {
        const mockOnTenantSwitch = vi.fn();

        render(
            <TenantSwitcher
                tenants={mockTenants}
                activeTenantId="tenant-1"
                onTenantSwitch={mockOnTenantSwitch}
            />
        );

        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
    });

    it('should show loading state', () => {
        const mockOnTenantSwitch = vi.fn();

        render(
            <TenantSwitcher
                tenants={[]}
                activeTenantId={null}
                onTenantSwitch={mockOnTenantSwitch}
                loading={true}
            />
        );

        expect(screen.getByRole('button')).toHaveClass('animate-pulse');
    });

    it('should show no active tenant message', () => {
        const mockOnTenantSwitch = vi.fn();

        render(
            <TenantSwitcher
                tenants={[]}
                activeTenantId={null}
                onTenantSwitch={mockOnTenantSwitch}
                loading={false}
            />
        );

        expect(screen.getByText('No active tenant')).toBeInTheDocument();
    });

    it('should open dropdown when clicked', async () => {
        const mockOnTenantSwitch = vi.fn();

        render(
            <TenantSwitcher
                tenants={mockTenants}
                activeTenantId="tenant-1"
                onTenantSwitch={mockOnTenantSwitch}
            />
        );

        const button = screen.getByRole('button');
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText('Beta Inc')).toBeInTheDocument();
            expect(screen.getByText('Beta Industries')).toBeInTheDocument();
        });
    });

    it('should call onTenantSwitch when tenant is selected', async () => {
        const mockOnTenantSwitch = vi.fn().mockResolvedValue(undefined);

        render(
            <TenantSwitcher
                tenants={mockTenants}
                activeTenantId="tenant-1"
                onTenantSwitch={mockOnTenantSwitch}
            />
        );

        const button = screen.getByRole('button');
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText('Beta Inc')).toBeInTheDocument();
        });

        const betaTenant = screen.getByText('Beta Inc').closest('button');
        fireEvent.click(betaTenant!);

        await waitFor(() => {
            expect(mockOnTenantSwitch).toHaveBeenCalledWith('tenant-2');
        });
    });

    it('should show switching state during tenant switch', async () => {
        const mockOnTenantSwitch = vi.fn().mockImplementation(() =>
            new Promise(resolve => setTimeout(resolve, 100))
        );

        render(
            <TenantSwitcher
                tenants={mockTenants}
                activeTenantId="tenant-1"
                onTenantSwitch={mockOnTenantSwitch}
            />
        );

        const button = screen.getByRole('button');
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText('Beta Inc')).toBeInTheDocument();
        });

        const betaTenant = screen.getByText('Beta Inc').closest('button');
        fireEvent.click(betaTenant!);

        // Should show loading spinner
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should close dropdown when backdrop is clicked', async () => {
        const mockOnTenantSwitch = vi.fn();

        render(
            <TenantSwitcher
                tenants={mockTenants}
                activeTenantId="tenant-1"
                onTenantSwitch={mockOnTenantSwitch}
            />
        );

        const button = screen.getByRole('button');
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText('Beta Inc')).toBeInTheDocument();
        });

        // Click backdrop
        const backdrop = document.querySelector('.fixed.inset-0');
        fireEvent.click(backdrop!);

        await waitFor(() => {
            expect(screen.queryByText('Beta Inc')).not.toBeInTheDocument();
        });
    });

    it('should not call onTenantSwitch for already active tenant', async () => {
        const mockOnTenantSwitch = vi.fn();

        render(
            <TenantSwitcher
                tenants={mockTenants}
                activeTenantId="tenant-1"
                onTenantSwitch={mockOnTenantSwitch}
            />
        );

        const button = screen.getByRole('button');
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText('Acme Corp')).toBeInTheDocument();
        });

        // Click on active tenant
        const activeTenant = screen.getByText('Acme Corp').closest('button');
        fireEvent.click(activeTenant!);

        expect(mockOnTenantSwitch).not.toHaveBeenCalled();
    });
});
