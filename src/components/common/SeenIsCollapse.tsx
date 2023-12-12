import { AnimatePresence, motion } from "framer-motion";

interface Props {
  visible: boolean;
  children?: React.ReactNode;
}

export const SeenIsCollapse: React.FC<Props> = ({
  visible,
  children,
}: Props) => {
  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          key="seen-is-collapse"
          initial="collapsed"
          animate="open"
          exit="collapsed"
          variants={{
            open: { opacity: 1, height: "auto" },
            collapsed: { opacity: 0, height: 0 },
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
