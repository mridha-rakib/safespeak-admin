import { ADMIN_OPERATIONS_CONFIGS } from "@/components/admin/admin-operations-config";
import {
  AdminOperationsSectionPage,
  type AdminOperationsSectionConfig,
} from "@/components/admin/admin-operations-section-page";
import { getEducationalContentOverview } from "@/lib/educational-content";
import { useEffect, useState } from "react";

export function AdminContentEducationalContentRoutePage() {
  const [config, setConfig] = useState<AdminOperationsSectionConfig>(
    ADMIN_OPERATIONS_CONFIGS.educationalContent,
  );

  useEffect(() => {
    let isMounted = true;

    void getEducationalContentOverview()
      .then((educationalContent) => {
        if (isMounted) {
          setConfig(educationalContent);
        }
      })
      .catch(() => {
        if (isMounted) {
          setConfig(ADMIN_OPERATIONS_CONFIGS.educationalContent);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return <AdminOperationsSectionPage config={config} />;
}
