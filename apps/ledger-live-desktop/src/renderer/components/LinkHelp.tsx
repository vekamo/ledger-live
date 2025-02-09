import React from "react";
import styled from "styled-components";
import { rgba } from "~/renderer/styles/helpers";
import IconHelp from "~/renderer/icons/Help";
import Box from "./Box";
import Label from "./Label";
const Wrapper = styled(Label).attrs(() => ({
  ff: "Inter|SemiBold",
  color: "wallet",
  fontSize: 4,
  alignItems: "center",
}))`
  display: flex;
  cursor: pointer;

  &:hover {
    color: ${p => rgba(p.theme.colors.wallet, 0.9)};
  }
`;
type Props = {
  onClick: (() => void) | undefined | null;
  label?: React.ReactNode;
  children?: React.ReactNode;
  iconSize?: number;
  Icon?: React.ComponentType<any>;
  style?: any;
}; // can add more dynamic options if needed
export function LinkHelp({ onClick, label, children, iconSize = 12, Icon, style }: Props) {
  const I = Icon || IconHelp;
  return (
    <Wrapper onClick={onClick} style={style}>
      <Box mr={1}>
        <I size={iconSize} />
      </Box>
      <span>{label || children}</span>
    </Wrapper>
  );
}
export default LinkHelp;
