import { useState } from 'react';
import ModuleMap from './ModuleMap';
import ModulePage from './ModulePage';
import { Task } from './curriculum';

interface ModulesViewProps {
  onStartTask: (task: Task) => void;
}

export default function ModulesView({ onStartTask }: ModulesViewProps) {
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  if (selectedModuleId) {
    return (
      <ModulePage
        moduleId={selectedModuleId}
        onBack={() => setSelectedModuleId(null)}
        onStartTask={onStartTask}
      />
    );
  }

  return <ModuleMap onSelectModule={setSelectedModuleId} />;
}
