import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function AnimatedTabs({ tabs, activeTab, setActiveTab }) {
  return (
    <div className="relative border bg-white overflow-hidden px-3 rounded-md mb-2 w-full">
      <nav
        className="flex w-full justify-start items-start gap-4"
        aria-label="Tabs"
        role="tablist"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.name)}
            role="tab"
            aria-selected={activeTab === tab.name}
            aria-controls={`${tab.name}-tab`}
            id={`${tab.name}-trigger`}
            className={cn(
              "relative px-4 py-3 text-[13.5px] font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              activeTab === tab.name ? "text-primary" : "text-muted-foreground"
            )}
          >
            {tab.title}
            {activeTab === tab.name && (
              <motion.div
                layoutId="activeTab"
                className="absolute w-full bottom-0 left-0 right-0 h-[3px] rounded-t bg-primary"
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                }}
              />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
