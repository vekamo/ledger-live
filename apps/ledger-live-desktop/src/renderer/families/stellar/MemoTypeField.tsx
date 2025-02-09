import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { StellarMemoType } from "@ledgerhq/live-common/families/stellar/types";
import Select from "~/renderer/components/Select";
import invariant from "invariant";
import { Account } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/live-common/generated/types";
const options = StellarMemoType.map(type => ({
  label: type,
  value: type,
}));
const MemoTypeField = ({
  onChange,
  account,
  transaction,
}: {
  onChange: (a: string) => void;
  account: Account;
  transaction: Transaction;
}) => {
  invariant(transaction.family === "stellar", "MemoTypeField: stellar family expected");
  const bridge = getAccountBridge(account);
  const selectedMemoType =
    options.find(option => option.value === transaction.memoType) || options[0];
  const onMemoTypeChange = useCallback(
    memoType => {
      onChange(
        bridge.updateTransaction(transaction, {
          memoType: memoType.value,
        }),
      );
    },
    [onChange, bridge, transaction],
  );
  return (
    <Select
      width="156px"
      isSearchable={false}
      onChange={onMemoTypeChange}
      value={selectedMemoType}
      options={options}
      renderOption={({ label }) => <Trans i18nKey={`families.stellar.memoType.${label}`} />}
      renderValue={({ data: { label } }) => (
        <Trans i18nKey={`families.stellar.memoType.${label}`} />
      )}
    />
  );
};
export default MemoTypeField;
