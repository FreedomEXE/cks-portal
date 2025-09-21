# CKS Portal - Development Best Practices

*Property of CKS © 2025 - Manifested by Freedom*

## 🏗️ Architecture Principles

### **Hub Independence (Critical)**
- Each hub MUST remain completely isolated from other hubs
- No shared components between hubs for security reasons
- Hub-specific utilities, hooks, and components only
- Use hub-prefixed session storage keys (`manager:session`, `crew:session`, etc.)

### **Single-Page Hub Pattern**  
- Consolidate all hub functionality into one `Home.tsx` component (~400-500 lines)
- Use tabbed sections with useState for navigation
- Avoid complex routing within hubs - keep it simple

## 🎨 UI/UX Standards

### **Color Coding (Fixed)**
- **Admin Hub**: Black (#000000)
- **Manager Hub**: Blue (#3b82f6)  
- **Contractor Hub**: Green (#10b981)
- **Customer Hub**: Yellow (#eab308)
- **Center Hub**: Orange (#f97316)
- **Crew Hub**: Red (#ef4444)

### **Component Standards**
- Use Tailwind CSS utility classes consistently
- Follow existing UI primitive patterns (Button, Input, Select, Badge, Alert, Card, Table, Tabs)
- Maintain mobile-friendly responsive design
- Use proper ARIA labels and keyboard navigation

## 🆔 ID System Standards

### **Format Requirements**
- **MGR-XXX**: Managers (e.g., MGR-001, MGR-ABC)
- **CON-XXX**: Contractors (e.g., CON-001, CON-DEF)
- **CUS-XXX**: Customers (e.g., CUS-001, CUS-GHI)
- **CEN-XXX**: Centers (e.g., CEN-001, CEN-JKL)
- **CRW-XXX**: Crew (e.g., CRW-001, CRW-MNO)
- **ADM-XXX**: Admin (e.g., ADM-001, ADM-PQR)

### **Usage**
- IDs become login credentials
- Use for role detection and hub routing
- Prefix determines hub access and data visibility

## 🔧 Technical Standards

### **API Communication**
```typescript
// CORRECT - Use string concatenation for relative paths
export function buildHubApiUrl(path: string, params: Record<string, any> = {}) {
  let url = HUB_API_BASE + path; // String concatenation
  // Add query params...
  return url;
}

// WRONG - Don't use URL constructor for relative paths
// new URL(API_BASE + path) // This fails
```

### **Authentication Headers**
```typescript
headers.set('x-hub-user-id', userId);
headers.set('x-hub-type', 'hubname');
```

### **Session Management**
```typescript
// Hub-prefixed storage keys
sessionStorage.setItem('manager:session', data);
sessionStorage.setItem('crew:session', data);
```

## 📁 File Organization

### **Hub Structure**
```
frontend/src/pages/Hub/[HubName]/
├── index.tsx          # Router (all routes → Home)
├── Home.tsx           # Consolidated hub component
├── utils/
│   ├── [hub]Auth.ts   # Hub-specific authentication
│   └── [hub]Api.ts    # Hub-specific API utilities
└── hooks/             # Hub-specific hooks (if needed)
```

### **Naming Conventions**
- Hub components: `Home.tsx` (consolidated pattern)
- Utils: `{hubname}Auth.ts`, `{hubname}Api.ts`
- Types: Use role-specific interfaces
- Components: PascalCase, descriptive names

## 🗄️ Database Standards

### **Schema Design**
- Use VARCHAR(20) for all ID fields to accommodate XXX-### format
- Implement proper foreign key relationships
- Use consistent status fields: 'active', 'inactive', 'pending'
- Include created_at and updated_at timestamps

### **Query Patterns**
- Filter data based on requesting user's role and ID
- Implement smart relationship queries (Crew → Center → Customer → Contractor → Manager)
- Use role-based data access controls

## ⚡ Performance Standards

### **Frontend**
- Keep hub components under 600 lines when possible
- Use React.memo for expensive calculations
- Implement proper loading states and error handling
- Optimize bundle size with proper imports

### **Backend**  
- Use connection pooling for database queries
- Implement proper error handling and logging
- Add request rate limiting
- Use appropriate HTTP status codes

## 🔒 Security Standards

### **Data Access**
- Users can only access data appropriate to their role
- Implement proper authentication checks on all endpoints
- Never expose sensitive data in API responses
- Use HTTPS in production

### **Session Security**
- Use secure session tokens
- Implement proper logout functionality
- Clear sensitive data on logout
- Validate user permissions on each request

## 🧪 Testing Standards

### **Test Coverage**
- Unit tests for business logic functions
- Integration tests for API endpoints  
- Component tests for hub functionality
- End-to-end tests for critical user workflows

### **Test Organization**
- Mirror src directory structure in tests
- Use descriptive test names
- Test error conditions and edge cases
- Mock external dependencies properly

## 📝 Code Documentation

### **Comment Standards**
```typescript
/**
 * File: Home.tsx (Hub Name - FULLY INDEPENDENT)
 * 
 * Description: Brief description of component purpose
 * Function: What this component does
 * Importance: Why this is important to the system
 * Connects to: What APIs, services, or components it uses
 * 
 * Notes: Any special considerations or requirements
 */
```

### **Function Documentation**
- Document complex business logic
- Explain API integration points
- Note any security considerations
- Include usage examples for utility functions

## 🚀 Deployment Standards

### **Environment Configuration**
- Use environment variables for configuration
- Never commit secrets or API keys
- Use different configs for dev/staging/prod
- Document required environment variables

### **Build Standards**
- Ensure TypeScript compilation passes
- Run linting and formatting checks
- Execute test suites before deployment
- Optimize production builds

## ❌ Common Pitfalls to Avoid

1. **Hub Cross-Dependencies**: Never import from other hub directories
2. **URL Constructor for Relative Paths**: Use string concatenation instead
3. **Shared Session Storage**: Always use hub-prefixed keys
4. **Payment Logic**: Not needed for MVP, avoid implementing
5. **Complex Hub Routing**: Keep hub navigation simple with tabs
6. **Data Migration Assumptions**: All data is created fresh via Admin Hub

## ✅ Code Review Checklist

- [ ] Hub independence maintained (no cross-hub imports)
- [ ] Proper ID format used (XXX-###)
- [ ] Security checks implemented for data access
- [ ] Error handling and loading states included
- [ ] TypeScript types properly defined
- [ ] Tests written for new functionality
- [ ] Documentation updated for changes
- [ ] No hardcoded secrets or API keys

---

*Following these practices ensures code quality, security, and maintainability across the CKS Portal project.*
