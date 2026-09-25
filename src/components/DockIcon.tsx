import React from 'react';
import { 
  Home, 
  CheckSquare, 
  Calendar, 
  Folder, 
  FileText, 
  Settings, 
  Sparkles, 
  Terminal, 
  Bookmark, 
  Clock,
  Layers,
  Globe,
  Music,
  MessageSquare,
  Monitor,
  Mail,
  Search,
  Code,
  Zap,
  Flame,
  Shield,
  Headphones,
  Camera,
  Download,
  Share2,
  LucideProps
} from 'lucide-react';

interface DockIconProps extends LucideProps {
  name: string;
}

export const DockIcon: React.FC<DockIconProps> = ({ name, ...props }) => {
  switch (name) {
    case 'Home':
      return <Home {...props} />;
    case 'CheckSquare':
      return <CheckSquare {...props} />;
    case 'Calendar':
      return <Calendar {...props} />;
    case 'Folder':
      return <Folder {...props} />;
    case 'FileText':
      return <FileText {...props} />;
    case 'Settings':
      return <Settings {...props} />;
    case 'Sparkles':
      return <Sparkles {...props} />;
    case 'Terminal':
      return <Terminal {...props} />;
    case 'Bookmark':
      return <Bookmark {...props} />;
    case 'Clock':
      return <Clock {...props} />;
    case 'Globe':
      return <Globe {...props} />;
    case 'Music':
      return <Music {...props} />;
    case 'MessageSquare':
      return <MessageSquare {...props} />;
    case 'Monitor':
      return <Monitor {...props} />;
    case 'Mail':
      return <Mail {...props} />;
    case 'Search':
      return <Search {...props} />;
    case 'Code':
      return <Code {...props} />;
    case 'Zap':
      return <Zap {...props} />;
    case 'Flame':
      return <Flame {...props} />;
    case 'Shield':
      return <Shield {...props} />;
    case 'Headphones':
      return <Headphones {...props} />;
    case 'Camera':
      return <Camera {...props} />;
    case 'Download':
      return <Download {...props} />;
    case 'Share2':
      return <Share2 {...props} />;
    default:
      return <Layers {...props} />;
  }
};
