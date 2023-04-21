import React from "react";
import { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import WarnBox from "~/renderer/components/WarnBox";
import { Trans } from "react-i18next";
import {
  MimbleWimbleCoinTransactionWontHavePaymentProofNoRecipient,
  MimbleWimbleCoinTransactionWontHavePaymentProofInapplicableAddress,
} from "@ledgerhq/live-common/families/mimblewimble_coin/errors";

const Warning = ({ status }: { status: TransactionStatus }) => {
  return (
    <WarnBox>
      {status.warnings.recipient instanceof
        MimbleWimbleCoinTransactionWontHavePaymentProofNoRecipient ||
      status.warnings.recipient instanceof
        MimbleWimbleCoinTransactionWontHavePaymentProofInapplicableAddress ? (
        <Trans i18nKey="families.mimblewimble_coin.noPaymentProof" />
      ) : (
        <Trans i18nKey="families.mimblewimble_coin.verifyRecipientPaymentProofAddress" />
      )}
    </WarnBox>
  );
};

export default {
  warning: Warning,
};
