# CKS Portal - Implement Welcome Messages and Clean Ecosystem View

## Project: ~/CKS/CKS-Portal (TypeScript + React)

## TASK 1: Fix Welcome Messages for New Users

### Implementation for Welcome Messages

1. **Backend Fix** - Add to user creation in `/backend/server/hubs/admin/routes.ts`:

```typescript
// After creating any new user (contractor, customer, center, crew)
await req.db.query(`
  INSERT INTO system_activity (user_id, user_role, action_type, description, metadata, created_at)
  VALUES ($1, $2, $3, $4, $5, NOW())
`, [
  newUserId,
  userRole,
  'welcome_message',
  `Welcome, ${userName} (${newUserId})! Your CKS Portal account is ready.`,
  JSON.stringify({ 
    message_type: 'welcome',
    show_tutorial: true 
  })
]);

Frontend Display - Update Recent Activity/Actions section in each hub:

typescript// In each hub's Recent Activity section
{activities.map(activity => (
  <div key={activity.id} className="border-l-4 border-gray-200 pl-4 py-2">
    {activity.action_type === 'welcome_message' ? (
      <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
        <p className="text-sm font-medium">{activity.description}</p>
        <button className="text-sm text-green-700 underline mt-1">
          Click here to launch the portal walkthrough
        </button>
      </div>
    ) : (
      <div className="text-sm">
        <p className="font-medium">{activity.description}</p>
        <p className="text-gray-500 text-xs">{activity.user_role} • {activity.created_at}</p>
      </div>
    )}
  </div>
))}
TASK 2: Create Clean "Ecosystem" Tab
Replace "My Customers/Contractors" with Ecosystem View

Create Ecosystem Component at /frontend/src/components/Ecosystem/EcosystemView.tsx:

typescriptimport React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Users, Building, MapPin, HardHat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EcosystemNode {
  id: string;
  name: string;
  type: 'manager' | 'contractor' | 'customer' | 'center' | 'crew';
  stats?: {
    customers?: number;
    centers?: number;
    crew?: number;
  };
  children?: EcosystemNode[];
}

interface EcosystemViewProps {
  userId: string;
  userType: string;
}

const EcosystemView: React.FC<EcosystemViewProps> = ({ userId, userType }) => {
  const [ecosystem, setEcosystem] = useState<EcosystemNode[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEcosystem();
  }, [userId]);

  const fetchEcosystem = async () => {
    try {
      const response = await fetch(`/api/${userType}/ecosystem`);
      const data = await response.json();
      setEcosystem(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load ecosystem:', error);
      setLoading(false);
    }
  };

  const toggleExpand = (nodeId: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpanded(newExpanded);
  };

  const getTypeColor = (type: string) => {
    const colors = {
      manager: 'text-blue-600 bg-blue-50',
      contractor: 'text-green-600 bg-green-50',
      customer: 'text-yellow-600 bg-yellow-50',
      center: 'text-orange-600 bg-orange-50',
      crew: 'text-red-600 bg-red-50'
    };
    return colors[type] || 'text-gray-600 bg-gray-50';
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'contractor': return <Users className="h-4 w-4" />;
      case 'customer': return <Building className="h-4 w-4" />;
      case 'center': return <MapPin className="h-4 w-4" />;
      case 'crew': return <HardHat className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const handleNodeClick = (node: EcosystemNode, event: React.MouseEvent) => {
    // If clicking on the ID link, navigate
    if ((event.target as HTMLElement).classList.contains('node-link')) {
      navigate(`/${userType}/${node.type}/${node.id}/profile`);
    }
  };

  const renderNode = (node: EcosystemNode, level: number = 0) => {
    const isExpanded = expanded.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="mb-1">
        <div 
          className={`flex items-center p-3 rounded hover:bg-gray-50 cursor-pointer`}
          style={{ paddingLeft: `${level * 24 + 12}px` }}
          onClick={(e) => handleNodeClick(node, e)}
        >
          {/* Expand/Collapse Icon */}
          <div 
            className="mr-2 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) toggleExpand(node.id);
            }}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )
            ) : (
              <div className="w-4 h-4" />
            )}
          </div>

          {/* Type Icon */}
          <div className={`mr-2 p-1 rounded ${getTypeColor(node.type)}`}>
            {getTypeIcon(node.type)}
          </div>

          {/* Node ID - Clickable */}
          <span 
            className="node-link font-medium text-blue-600 hover:underline cursor-pointer mr-2"
            onClick={(e) => e.stopPropagation()}
          >
            {node.id}
          </span>

          {/* Node Name */}
          <span className="text-gray-700 mr-auto">
            - {node.name}
          </span>

          {/* Stats */}
          {node.stats && (
            <div className="flex gap-3 text-xs text-gray-500">
              {node.stats.customers !== undefined && (
                <span>{node.stats.customers} customers</span>
              )}
              {node.stats.centers !== undefined && (
                <span>{node.stats.centers} centers</span>
              )}
              {node.stats.crew !== undefined && (
                <span>{node.stats.crew} crew</span>
              )}
            </div>
          )}
        </div>

        {/* Render Children */}
        {isExpanded && hasChildren && (
          <div className="border-l-2 border-gray-200 ml-6">
            {node.children!.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading ecosystem...</div>
      </div>
    );
  }

  if (!ecosystem || ecosystem.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No network connections yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Your ecosystem will appear here as connections are made
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-medium text-gray-900">Your Network Overview</h3>
        <p className="text-sm text-gray-500 mt-1">
          Click on any ID to view their profile • Click arrows to expand/collapse
        </p>
      </div>
      
      <div className="p-2">
        {ecosystem.map(node => renderNode(node))}
      </div>

      {/* Color Legend - Minimal */}
      <div className="p-4 border-t border-gray-200 flex gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-100 rounded"></div>
          <span>Contractor</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-100 rounded"></div>
          <span>Customer</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-100 rounded"></div>
          <span>Center</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-100 rounded"></div>
          <span>Crew</span>
        </div>
      </div>
    </div>
  );
};

export default EcosystemView;

Backend Endpoint for ecosystem data in each hub's routes:

typescript// Example for Manager Hub - /backend/server/hubs/manager/routes.ts
router.get('/ecosystem', authenticateManager, async (req: Request, res: Response) => {
  const managerId = (req as any).user.userId;
  
  try {
    // Get all contractors for this manager
    const contractors = await req.db.query(`
      SELECT 
        c.contractor_id as id,
        c.contractor_name as name,
        'contractor' as type,
        COUNT(DISTINCT cu.customer_id) as customer_count,
        COUNT(DISTINCT ce.center_id) as center_count
      FROM contractors c
      LEFT JOIN customers cu ON cu.contractor_id = c.contractor_id
      LEFT JOIN centers ce ON ce.customer_id = cu.customer_id
      WHERE c.cks_manager = $1
      GROUP BY c.contractor_id, c.contractor_name
    `, [managerId]);

    // For each contractor, get their customers
    const ecosystem = await Promise.all(contractors.rows.map(async (contractor) => {
      const customers = await req.db.query(`
        SELECT 
          cu.customer_id as id,
          cu.customer_name as name,
          'customer' as type,
          COUNT(DISTINCT ce.center_id) as center_count
        FROM customers cu
        LEFT JOIN centers ce ON ce.customer_id = cu.customer_id
        WHERE cu.contractor_id = $1
        GROUP BY cu.customer_id, cu.customer_name
      `, [contractor.id]);

      return {
        ...contractor,
        stats: {
          customers: contractor.customer_count,
          centers: contractor.center_count
        },
        children: customers.rows.map(customer => ({
          ...customer,
          stats: { centers: customer.center_count },
          children: [] // Add centers if needed
        }))
      };
    }));

    res.json(ecosystem);
  } catch (error) {
    console.error('Ecosystem error:', error);
    res.status(500).json({ error: 'Failed to load ecosystem' });
  }
});

Update Hub Tabs - Replace "My Customers" with "Ecosystem":

typescript// In each hub component, update the tab
<button 
  className={`px-4 py-2 ${activeTab === 'ecosystem' ? 'bg-black text-white' : 'bg-gray-200'} rounded`}
  onClick={() => setActiveTab('ecosystem')}
>
  Ecosystem
</button>

// In tab content
{activeTab === 'ecosystem' && (
  <EcosystemView userId={userId} userType={userType} />
)}