// This is just the state declaration section that needs to be added
// Add this after line 164 in WarehouseHub.tsx:

const [pendingAction, setPendingAction] = useState<{ orderId: string; action: OrderActionType } | null>(null);