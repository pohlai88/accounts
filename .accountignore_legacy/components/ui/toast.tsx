/**
 * Toast Notification System
 * Real-time feedback with business context and actions
 */

'use client'

import * as React from 'react'
import * as ToastPrimitives from '@radix-ui/react-toast'
import { cva, type VariantProps } from 'class-variance-authority'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Viewport>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Viewport
        ref={ref}
        className={cn(
            "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
            className
        )}
        {...props}
    />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
    "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
    {
        variants: {
            variant: {
                default: "border bg-background text-foreground",
                success: "border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-900/20 dark:text-green-100",
                error: "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-900/20 dark:text-red-100",
                warning: "border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-100",
                info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-100",
                business: "border-purple-200 bg-purple-50 text-purple-900 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-100",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

const Toast = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Root>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
    return (
        <ToastPrimitives.Root
            ref={ref}
            className={cn(toastVariants({ variant }), className)}
            {...props}
        />
    )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Action>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Action
        ref={ref}
        className={cn(
            "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
            className
        )}
        {...props}
    />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Close>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Close
        ref={ref}
        className={cn(
            "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
            className
        )}
        toast-close=""
        {...props}
    >
        <X className="h-4 w-4" />
    </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Title>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Title
        ref={ref}
        className={cn("text-sm font-semibold", className)}
        {...props}
    />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Description>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Description
        ref={ref}
        className={cn("text-sm opacity-90", className)}
        {...props}
    />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

// Enhanced Toast Hook with Business Context
interface ToastOptions {
    title?: string
    description?: string
    variant?: 'default' | 'success' | 'error' | 'warning' | 'info' | 'business'
    action?: ToastActionElement
    duration?: number
    persistent?: boolean
    businessContext?: {
        type: 'transaction' | 'payment' | 'reconciliation' | 'report' | 'system'
        entityId?: string
        amount?: number
        currency?: string
    }
}

interface Toast extends ToastOptions {
    id: string
    open: boolean
}

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 1000000

let count = 0

function genId() {
    count = (count + 1) % Number.MAX_VALUE
    return count.toString()
}

type ToasterToast = Toast

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
    if (toastTimeouts.has(toastId)) {
        return
    }

    const timeout = setTimeout(() => {
        toastTimeouts.delete(toastId)
        dispatch({
            type: "REMOVE_TOAST",
            toastId: toastId,
        })
    }, TOAST_REMOVE_DELAY)

    toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: ToasterToast[], action: any): ToasterToast[] => {
    switch (action.type) {
        case "ADD_TOAST":
            return [action.toast, ...state].slice(0, TOAST_LIMIT)

        case "UPDATE_TOAST":
            return state.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t))

        case "DISMISS_TOAST": {
            const { toastId } = action

            if (toastId) {
                addToRemoveQueue(toastId)
            } else {
                state.forEach((toast) => {
                    addToRemoveQueue(toast.id)
                })
            }

            return state.map((t) =>
                t.id === toastId || toastId === undefined
                    ? {
                        ...t,
                        open: false,
                    }
                    : t
            )
        }
        case "REMOVE_TOAST":
            if (action.toastId === undefined) {
                return []
            }
            return state.filter((t) => t.id !== action.toastId)
    }
}

const listeners: Array<(state: ToasterToast[]) => void> = []

let memoryState: ToasterToast[] = []

function dispatch(action: any) {
    memoryState = reducer(memoryState, action)
    listeners.forEach((listener) => {
        listener(memoryState)
    })
}

type Toast = Omit<ToasterToast, "id">

function toast(props: ToastOptions) {
    const id = genId()

    const update = (props: ToasterToast) =>
        dispatch({
            type: "UPDATE_TOAST",
            toast: { ...props, id },
        })
    const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

    dispatch({
        type: "ADD_TOAST",
        toast: {
            ...props,
            id,
            open: true,
            duration: props.persistent ? Infinity : (props.duration || 5000),
        },
    })

    return {
        id: id,
        dismiss,
        update,
    }
}

// Business-specific toast functions
function businessToast(type: string, message: string, options?: Partial<ToastOptions>) {
    const icons = {
        transaction: CheckCircle,
        payment: CheckCircle,
        reconciliation: CheckCircle,
        report: Info,
        system: AlertCircle
    }

    const Icon = icons[type as keyof typeof icons] || Info

    return toast({
        variant: 'business',
        title: (
            <div className="flex items-center space-x-2">
                <Icon className="h-4 w-4" />
                <span className="capitalize">{type} Update</span>
            </div>
        ),
        description: message,
        ...options
    })
}

// Convenience methods
toast.success = (message: string, options?: Partial<ToastOptions>) =>
    toast({ variant: 'success', description: message, ...options })

toast.error = (message: string, options?: Partial<ToastOptions>) =>
    toast({ variant: 'error', description: message, ...options })

toast.warning = (message: string, options?: Partial<ToastOptions>) =>
    toast({ variant: 'warning', description: message, ...options })

toast.info = (message: string, options?: Partial<ToastOptions>) =>
    toast({ variant: 'info', description: message, ...options })

toast.business = businessToast

// Transaction-specific toasts
toast.transaction = {
    created: (type: string, amount?: number, currency = 'MYR') =>
        toast.success(`${type} created successfully${amount ? ` for ${currency} ${amount.toLocaleString()}` : ''}`, {
            businessContext: { type: 'transaction', amount, currency }
        }),

    updated: (type: string) =>
        toast.info(`${type} updated successfully`, {
            businessContext: { type: 'transaction' }
        }),

    deleted: (type: string) =>
        toast.warning(`${type} deleted`, {
            businessContext: { type: 'transaction' }
        }),

    error: (message: string) =>
        toast.error(`Transaction error: ${message}`, {
            businessContext: { type: 'transaction' }
        })
}

// Payment-specific toasts
toast.payment = {
    received: (amount: number, currency = 'MYR', customer?: string) =>
        toast.success(`Payment received: ${currency} ${amount.toLocaleString()}${customer ? ` from ${customer}` : ''}`, {
            businessContext: { type: 'payment', amount, currency }
        }),

    sent: (amount: number, currency = 'MYR', supplier?: string) =>
        toast.success(`Payment sent: ${currency} ${amount.toLocaleString()}${supplier ? ` to ${supplier}` : ''}`, {
            businessContext: { type: 'payment', amount, currency }
        }),

    failed: (reason: string) =>
        toast.error(`Payment failed: ${reason}`, {
            businessContext: { type: 'payment' }
        })
}

// Reconciliation toasts
toast.reconciliation = {
    matched: (count: number) =>
        toast.success(`${count} transactions matched successfully`, {
            businessContext: { type: 'reconciliation' }
        }),

    completed: (account: string) =>
        toast.success(`Reconciliation completed for ${account}`, {
            businessContext: { type: 'reconciliation' }
        }),

    discrepancy: (amount: number, currency = 'MYR') =>
        toast.warning(`Reconciliation discrepancy: ${currency} ${amount.toLocaleString()}`, {
            businessContext: { type: 'reconciliation', amount, currency },
            persistent: true
        })
}

function useToast() {
    const [state, setState] = React.useState<ToasterToast[]>(memoryState)

    React.useEffect(() => {
        listeners.push(setState)
        return () => {
            const index = listeners.indexOf(setState)
            if (index > -1) {
                listeners.splice(index, 1)
            }
        }
    }, [state])

    return {
        ...toast,
        toast,
        dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
        toasts: state,
    }
}

export {
    type ToasterToast,
    useToast,
    toast,
    Toast,
    ToastProvider,
    ToastViewport,
    ToastTitle,
    ToastDescription,
    ToastClose,
    ToastAction,
}
