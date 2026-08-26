import { Text } from "../../design-system/primitives/Text";

export function BioBlock() {
  return (
    <div className="bio-block">
      <Text variant="primary" className="bio-text-primary">
        Guiding AI at Meta to build internal tools—helping fellow humans create, code, and lead with AI.
      </Text>
      <Text variant="secondary" className="bio-text-secondary">
        <span aria-hidden="true">❤️</span>
        <span>Father of 3 kids, drowning in love and work.</span>
      </Text>
    </div>
  );
}
