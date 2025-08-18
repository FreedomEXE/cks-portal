/**
 * CKS Portal — ErrorBoundary
 *
 * Purpose: Catch React render errors and show a friendly fallback instead of a blank screen.
 * Change summary (Aug 2025): Implemented default export to satisfy main.tsx import.
 */
import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: any };

class ErrorBoundary extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: any): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: any, info: any) {
		// Log to console in dev to aid debugging
		if (typeof window !== 'undefined') {
			// eslint-disable-next-line no-console
			console.error("ErrorBoundary caught:", error, info);
		}
	}

		render() {
			if (this.state.hasError) {
				// Always show details during troubleshooting so we can see the exact error
				const showDetails = true;
				return (
					<div style={{ padding: 24 }}>
						<div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Something went wrong.</div>
						<div style={{ color: "#6b7280", marginBottom: showDetails ? 12 : 0 }}>Please refresh the page or try again later.</div>
						<div style={{ color: '#b91c1c', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', whiteSpace: 'pre-wrap', marginTop: 8 }}>
							{String(this.state.error?.message || this.state.error || '')}
						</div>
						{showDetails ? (
							<details open style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
								<summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: 8 }}>Error details</summary>
								<pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
									{String(this.state.error?.message || this.state.error || '(no message)')}
									{"\n\n"}
									{String((this.state.error?.stack as any) || '')}
								</pre>
							</details>
						) : null}
					</div>
				);
			}
			return this.props.children;
		}
}

export default ErrorBoundary;
export { ErrorBoundary };
