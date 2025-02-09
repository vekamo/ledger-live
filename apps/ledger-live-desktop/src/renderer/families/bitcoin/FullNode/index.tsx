import React, { useState } from "react";
import Modal from "~/renderer/components/Modal";
import styled from "styled-components";
import { rgba } from "~/renderer/styles/helpers";
import useEnv from "~/renderer/hooks/useEnv";
import FullNodeBody from "./FullNodeBody";

export type FullNodeSteps = "landing" | "node" | "device" | "accounts" | "satstack" | "disconnect";
export const connectionStatus = Object.freeze({
  IDLE: "idle",
  PENDING: "pending",
  SUCCESS: "success",
  FAILURE: "failure",
});
export type ConnectionStatus = typeof connectionStatus[keyof typeof connectionStatus];
export const CheckWrapper: ThemedComponent<{
  size?: number;
}> = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: ${p => p.size}px;
  width: ${p => p.size}px;
  border-radius: ${p => p.size}px;
  background-color: ${p => rgba(p.theme.colors.positiveGreen, 0.2)};
  color: ${p => p.theme.colors.positiveGreen};
`;
export const CrossWrapper: ThemedComponent<{
  size: number;
}> = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: ${p => p.size}px;
  width: ${p => p.size}px;
  border-radius: ${p => p.size}px;
  background-color: ${p => rgba(p.theme.colors.alertRed, 0.2)};
  color: ${p => p.theme.colors.alertRed};
`;
const FullNode = ({ data, onClose }: any) => {
  const satStackAlreadyConfigured = useEnv("SATSTACK");
  const [stepId, setStepId] = useState(() =>
    data?.skipNodeSetup ? "accounts" : satStackAlreadyConfigured ? "node" : "landing",
  );
  return <FullNodeBody onStepChange={setStepId} activeStep={stepId} onClose={onClose} />;
};
const render = ({ data, onClose }) => <FullNode onClose={onClose} data={data} />;
const FullNodeModal = () => (
  <Modal name="MODAL_BITCOIN_FULL_NODE" centered preventBackdropClick render={render} />
);
export default FullNodeModal;
