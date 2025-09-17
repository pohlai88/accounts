[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/ui](../README.md) / [](../README.md) / ErrorBoundary

# Class: ErrorBoundary

Defined in: [packages/ui/src/components/common/ErrorBoundary.tsx:222](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/ui/src/components/common/ErrorBoundary.tsx#L222)

## Extends

- `Component`\<`ErrorBoundaryProps`, `ErrorBoundaryState`\>

## Constructors

### Constructor

> **new ErrorBoundary**(`props`): `ErrorBoundary`

Defined in: [packages/ui/src/components/common/ErrorBoundary.tsx:226](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/ui/src/components/common/ErrorBoundary.tsx#L226)

#### Parameters

##### props

`ErrorBoundaryProps`

#### Returns

`ErrorBoundary`

#### Overrides

`Component<ErrorBoundaryProps, ErrorBoundaryState>.constructor`

## Properties

### context

> **context**: `unknown`

Defined in: node\_modules/.pnpm/@types+react@18.3.24/node\_modules/@types/react/index.d.ts:1014

If using the new style context, re-declare this in your class to be the
`React.ContextType` of your `static contextType`.
Should be used with type annotation or static contextType.

#### Example

```ts
static contextType = MyContext
// For TS pre-3.7:
context!: React.ContextType<typeof MyContext>
// For TS 3.7 and above:
declare context: React.ContextType<typeof MyContext>
```

#### See

[React Docs](https://react.dev/reference/react/Component#context)

#### Inherited from

`Component.context`

***

### props

> `readonly` **props**: `Readonly`\<`P`\>

Defined in: node\_modules/.pnpm/@types+react@18.3.24/node\_modules/@types/react/index.d.ts:1034

#### Inherited from

`Component.props`

***

### ~~refs~~

> **refs**: `object`

Defined in: node\_modules/.pnpm/@types+react@18.3.24/node\_modules/@types/react/index.d.ts:1041

#### Index Signature

\[`key`: `string`\]: `ReactInstance`

#### Deprecated

#### See

[Legacy React Docs](https://legacy.reactjs.org/docs/refs-and-the-dom.html#legacy-api-string-refs)

#### Inherited from

`Component.refs`

***

### state

> **state**: `Readonly`\<`S`\>

Defined in: node\_modules/.pnpm/@types+react@18.3.24/node\_modules/@types/react/index.d.ts:1035

#### Inherited from

`Component.state`

***

### contextType?

> `static` `optional` **contextType**: `Context`\<`any`\>

Defined in: node\_modules/.pnpm/@types+react@18.3.24/node\_modules/@types/react/index.d.ts:996

If set, `this.context` will be set at runtime to the current value of the given Context.

#### Example

```ts
type MyContext = number
const Ctx = React.createContext<MyContext>(0)

class Foo extends React.Component {
  static contextType = Ctx
  context!: React.ContextType<typeof Ctx>
  render () {
    return <>My context's value: {this.context}</>;
  }
}
```

#### See

[https://react.dev/reference/react/Component#static-contexttype](https://react.dev/reference/react/Component#static-contexttype)

#### Inherited from

`Component.contextType`

## Methods

### componentDidCatch()

> **componentDidCatch**(`error`, `errorInfo`): `void`

Defined in: [packages/ui/src/components/common/ErrorBoundary.tsx:249](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/ui/src/components/common/ErrorBoundary.tsx#L249)

Catches exceptions generated in descendant components. Unhandled exceptions will cause
the entire component tree to unmount.

#### Parameters

##### error

`Error`

##### errorInfo

`ErrorInfo`

#### Returns

`void`

#### Overrides

`Component.componentDidCatch`

***

### componentDidMount()?

> `optional` **componentDidMount**(): `void`

Defined in: node\_modules/.pnpm/@types+react@18.3.24/node\_modules/@types/react/index.d.ts:1377

Called immediately after a component is mounted. Setting state here will trigger re-rendering.

#### Returns

`void`

#### Inherited from

`Component.componentDidMount`

***

### componentDidUpdate()

> **componentDidUpdate**(`prevProps`): `void`

Defined in: [packages/ui/src/components/common/ErrorBoundary.tsx:273](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/ui/src/components/common/ErrorBoundary.tsx#L273)

Called immediately after updating occurs. Not called for the initial render.

The snapshot is only present if [getSnapshotBeforeUpdate](#getsnapshotbeforeupdate) is present and returns non-null.

#### Parameters

##### prevProps

`ErrorBoundaryProps`

#### Returns

`void`

#### Overrides

`Component.componentDidUpdate`

***

### ~~componentWillMount()?~~

> `optional` **componentWillMount**(): `void`

Defined in: node\_modules/.pnpm/@types+react@18.3.24/node\_modules/@types/react/index.d.ts:1456

Called immediately before mounting occurs, and before Component.render.
Avoid introducing any side-effects or subscriptions in this method.

Note: the presence of [getSnapshotBeforeUpdate](#getsnapshotbeforeupdate)
or StaticLifecycle.getDerivedStateFromProps getDerivedStateFromProps prevents
this from being invoked.

#### Returns

`void`

#### Deprecated

16.3, use [componentDidMount](#componentdidmount) or the constructor instead; will stop working in React 17

#### See

 - [https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#initializing-state](https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#initializing-state)
 - [https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path](https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path)

#### Inherited from

`Component.componentWillMount`

***

### ~~componentWillReceiveProps()?~~

> `optional` **componentWillReceiveProps**(`nextProps`, `nextContext`): `void`

Defined in: node\_modules/.pnpm/@types+react@18.3.24/node\_modules/@types/react/index.d.ts:1487

Called when the component may be receiving new props.
React may call this even if props have not changed, so be sure to compare new and existing
props if you only want to handle changes.

Calling [Component.setState](#setstate) generally does not trigger this method.

Note: the presence of [getSnapshotBeforeUpdate](#getsnapshotbeforeupdate)
or StaticLifecycle.getDerivedStateFromProps getDerivedStateFromProps prevents
this from being invoked.

#### Parameters

##### nextProps

`Readonly`\<`P`\>

##### nextContext

`any`

#### Returns

`void`

#### Deprecated

16.3, use static StaticLifecycle.getDerivedStateFromProps getDerivedStateFromProps instead; will stop working in React 17

#### See

 - [https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#updating-state-based-on-props](https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#updating-state-based-on-props)
 - [https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path](https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path)

#### Inherited from

`Component.componentWillReceiveProps`

***

### componentWillUnmount()

> **componentWillUnmount**(): `void`

Defined in: [packages/ui/src/components/common/ErrorBoundary.tsx:291](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/ui/src/components/common/ErrorBoundary.tsx#L291)

Called immediately before a component is destroyed. Perform any necessary cleanup in this method, such as
cancelled network requests, or cleaning up any DOM elements created in `componentDidMount`.

#### Returns

`void`

#### Overrides

`Component.componentWillUnmount`

***

### ~~componentWillUpdate()?~~

> `optional` **componentWillUpdate**(`nextProps`, `nextState`, `nextContext`): `void`

Defined in: node\_modules/.pnpm/@types+react@18.3.24/node\_modules/@types/react/index.d.ts:1519

Called immediately before rendering when new props or state is received. Not called for the initial render.

Note: You cannot call [Component.setState](#setstate) here.

Note: the presence of [getSnapshotBeforeUpdate](#getsnapshotbeforeupdate)
or StaticLifecycle.getDerivedStateFromProps getDerivedStateFromProps prevents
this from being invoked.

#### Parameters

##### nextProps

`Readonly`\<`P`\>

##### nextState

`Readonly`\<`S`\>

##### nextContext

`any`

#### Returns

`void`

#### Deprecated

16.3, use getSnapshotBeforeUpdate instead; will stop working in React 17

#### See

 - [https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#reading-dom-properties-before-an-update](https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#reading-dom-properties-before-an-update)
 - [https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path](https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path)

#### Inherited from

`Component.componentWillUpdate`

***

### forceUpdate()

> **forceUpdate**(`callback?`): `void`

Defined in: node\_modules/.pnpm/@types+react@18.3.24/node\_modules/@types/react/index.d.ts:1031

#### Parameters

##### callback?

() => `void`

#### Returns

`void`

#### Inherited from

`Component.forceUpdate`

***

### getSnapshotBeforeUpdate()?

> `optional` **getSnapshotBeforeUpdate**(`prevProps`, `prevState`): `any`

Defined in: node\_modules/.pnpm/@types+react@18.3.24/node\_modules/@types/react/index.d.ts:1434

Runs before React applies the result of Component.render render to the document, and
returns an object to be given to [componentDidUpdate](#componentdidupdate). Useful for saving
things such as scroll position before Component.render render causes changes to it.

Note: the presence of this method prevents any of the deprecated
lifecycle events from running.

#### Parameters

##### prevProps

`Readonly`\<`P`\>

##### prevState

`Readonly`\<`S`\>

#### Returns

`any`

#### Inherited from

`Component.getSnapshotBeforeUpdate`

***

### render()

> **render**(): `ReactNode`

Defined in: [packages/ui/src/components/common/ErrorBoundary.tsx:358](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/ui/src/components/common/ErrorBoundary.tsx#L358)

#### Returns

`ReactNode`

#### Overrides

`Component.render`

***

### setState()

> **setState**\<`K`\>(`state`, `callback?`): `void`

Defined in: node\_modules/.pnpm/@types+react@18.3.24/node\_modules/@types/react/index.d.ts:1026

#### Type Parameters

##### K

`K` *extends* keyof `ErrorBoundaryState`

#### Parameters

##### state

`null` | `ErrorBoundaryState` | (`prevState`, `props`) => `null` \| `ErrorBoundaryState` \| `Pick`\<`ErrorBoundaryState`, `K`\> | `Pick`\<`ErrorBoundaryState`, `K`\>

##### callback?

() => `void`

#### Returns

`void`

#### Inherited from

`Component.setState`

***

### shouldComponentUpdate()?

> `optional` **shouldComponentUpdate**(`nextProps`, `nextState`, `nextContext`): `boolean`

Defined in: node\_modules/.pnpm/@types+react@18.3.24/node\_modules/@types/react/index.d.ts:1388

Called to determine whether the change in props and state should trigger a re-render.

`Component` always returns true.
`PureComponent` implements a shallow comparison on props and state and returns true if any
props or states have changed.

If false is returned, Component.render, `componentWillUpdate`
and `componentDidUpdate` will not be called.

#### Parameters

##### nextProps

`Readonly`\<`P`\>

##### nextState

`Readonly`\<`S`\>

##### nextContext

`any`

#### Returns

`boolean`

#### Inherited from

`Component.shouldComponentUpdate`

***

### ~~UNSAFE\_componentWillMount()?~~

> `optional` **UNSAFE\_componentWillMount**(): `void`

Defined in: node\_modules/.pnpm/@types+react@18.3.24/node\_modules/@types/react/index.d.ts:1471

Called immediately before mounting occurs, and before Component.render.
Avoid introducing any side-effects or subscriptions in this method.

This method will not stop working in React 17.

Note: the presence of [getSnapshotBeforeUpdate](#getsnapshotbeforeupdate)
or StaticLifecycle.getDerivedStateFromProps getDerivedStateFromProps prevents
this from being invoked.

#### Returns

`void`

#### Deprecated

16.3, use [componentDidMount](#componentdidmount) or the constructor instead

#### See

 - [https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#initializing-state](https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#initializing-state)
 - [https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path](https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path)

#### Inherited from

`Component.UNSAFE_componentWillMount`

***

### ~~UNSAFE\_componentWillReceiveProps()?~~

> `optional` **UNSAFE\_componentWillReceiveProps**(`nextProps`, `nextContext`): `void`

Defined in: node\_modules/.pnpm/@types+react@18.3.24/node\_modules/@types/react/index.d.ts:1505

Called when the component may be receiving new props.
React may call this even if props have not changed, so be sure to compare new and existing
props if you only want to handle changes.

Calling [Component.setState](#setstate) generally does not trigger this method.

This method will not stop working in React 17.

Note: the presence of [getSnapshotBeforeUpdate](#getsnapshotbeforeupdate)
or StaticLifecycle.getDerivedStateFromProps getDerivedStateFromProps prevents
this from being invoked.

#### Parameters

##### nextProps

`Readonly`\<`P`\>

##### nextContext

`any`

#### Returns

`void`

#### Deprecated

16.3, use static StaticLifecycle.getDerivedStateFromProps getDerivedStateFromProps instead

#### See

 - [https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#updating-state-based-on-props](https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#updating-state-based-on-props)
 - [https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path](https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path)

#### Inherited from

`Component.UNSAFE_componentWillReceiveProps`

***

### ~~UNSAFE\_componentWillUpdate()?~~

> `optional` **UNSAFE\_componentWillUpdate**(`nextProps`, `nextState`, `nextContext`): `void`

Defined in: node\_modules/.pnpm/@types+react@18.3.24/node\_modules/@types/react/index.d.ts:1535

Called immediately before rendering when new props or state is received. Not called for the initial render.

Note: You cannot call [Component.setState](#setstate) here.

This method will not stop working in React 17.

Note: the presence of [getSnapshotBeforeUpdate](#getsnapshotbeforeupdate)
or StaticLifecycle.getDerivedStateFromProps getDerivedStateFromProps prevents
this from being invoked.

#### Parameters

##### nextProps

`Readonly`\<`P`\>

##### nextState

`Readonly`\<`S`\>

##### nextContext

`any`

#### Returns

`void`

#### Deprecated

16.3, use getSnapshotBeforeUpdate instead

#### See

 - [https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#reading-dom-properties-before-an-update](https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#reading-dom-properties-before-an-update)
 - [https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path](https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html#gradual-migration-path)

#### Inherited from

`Component.UNSAFE_componentWillUpdate`

***

### getDerivedStateFromError()

> `static` **getDerivedStateFromError**(`error`): `Partial`\<`ErrorBoundaryState`\>

Defined in: [packages/ui/src/components/common/ErrorBoundary.tsx:242](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/ui/src/components/common/ErrorBoundary.tsx#L242)

#### Parameters

##### error

`Error`

#### Returns

`Partial`\<`ErrorBoundaryState`\>
