import { ADMIN_OPERATIONS_CONFIGS } from "@/components/admin/admin-operations-config";
import {
  AdminOperationsSectionPage,
  type AdminOperationsSectionConfig,
} from "@/components/admin/admin-operations-section-page";
import { getLanguagePacksOverview } from "@/lib/language-packs";
import { useEffect, useState } from "react";

export function AdminLanguagePacksPage() {
  const [config, setConfig] = useState<AdminOperationsSectionConfig>(
    ADMIN_OPERATIONS_CONFIGS.languagePacks,
  );

  const refreshConfig = async () => {
    const languagePacks = await getLanguagePacksOverview();
    setConfig(languagePacks);
  };

  useEffect(() => {
    let isMounted = true;

    void getLanguagePacksOverview()
      .then((languagePacks) => {
        if (isMounted) {
          setConfig(languagePacks);
        }
      })
      .catch(() => {
        if (isMounted) {
          setConfig(ADMIN_OPERATIONS_CONFIGS.languagePacks);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AdminOperationsSectionPage
      config={config}
      onRefreshConfig={refreshConfig}
    />
  );
}
