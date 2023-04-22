import React, { useEffect, PureComponent } from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { Trans } from "react-i18next";
import { concat, from, Subscription } from "rxjs";
import { ignoreElements, filter, map } from "rxjs/operators";
import { Account } from "@ledgerhq/types-live";
import { isAccountEmpty, groupAddAccounts } from "@ledgerhq/live-common/account/index";
import { openModal } from "~/renderer/actions/modals";
import { DeviceShouldStayInApp } from "@ledgerhq/errors";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import uniq from "lodash/uniq";
import { urls } from "~/config/urls";
import logger from "~/renderer/logger";
import { prepareCurrency } from "~/renderer/bridge/cache";
import TrackPage from "~/renderer/analytics/TrackPage";
import RetryButton from "~/renderer/components/RetryButton";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import CurrencyBadge from "~/renderer/components/CurrencyBadge";
import AccountsList from "~/renderer/components/AccountsList";
import Spinner from "~/renderer/components/Spinner";
import Text from "~/renderer/components/Text";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import Switch from "~/renderer/components/Switch";
import { StepProps } from "..";
import InfoCircle from "~/renderer/icons/InfoCircle";
import ToolTip from "~/renderer/components/Tooltip";
import byFamilyNoAssociatedAccounts from "~/renderer/generated/NoAssociatedAccounts";
import byFamilyStepImport from "~/renderer/generated/StepImport";

// TODO: This Error return type is just wrong…
const remapTransportError = (err: unknown, appName: string): Error => {
  if (!err || typeof err !== "object") return err as Error;
  const { name, statusCode } = err as { name: string; statusCode: number };
  const errorToThrow =
    name === "BtcUnmatchedApp" || statusCode === 0x6982 || statusCode === 0x6700
      ? new DeviceShouldStayInApp(undefined, {
          appName,
        })
      : err;
  return errorToThrow as Error;
};
const LoadingRow = styled(Box).attrs(() => ({
  horizontal: true,
  borderRadius: 1,
  px: 3,
  alignItems: "center",
  justifyContent: "center",
  mt: 1,
}))`
  height: 48px;
  border: 1px dashed ${p => p.theme.colors.palette.text.shade60};
`;
const SectionAccounts = ({ defaultSelected, ...rest }: any) => {
  // componentDidMount-like effect
  useEffect(() => {
    if (defaultSelected && rest.onSelectAll) {
      rest.onSelectAll(rest.accounts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <AccountsList {...rest} />;
};
class StepImport extends PureComponent<
  StepProps,
  {
    showAllCreatedAccounts: boolean;
  }
> {
  constructor(props: StepProps) {
    super(props);
    this.state = {
      showAllCreatedAccounts: false,
    };
  }

  componentDidMount() {
    const { currency, setScanStatus } = this.props;
    if (currency && byFamilyStepImport[currency.family]) {
      return;
    }
    setScanStatus("scanning");
  }

  componentDidUpdate(prevProps: StepProps) {
    const { currency, scanStatus } = this.props;
    if (currency && byFamilyStepImport[currency.family]) {
      return;
    }
    const didStartScan = prevProps.scanStatus !== "scanning" && scanStatus === "scanning";
    const didFinishScan = prevProps.scanStatus !== "finished" && scanStatus === "finished";

    // handle case when we click on retry sync
    if (didStartScan) {
      this.startScanAccountsDevice();
    }

    // handle case when we click on stop sync
    if (didFinishScan) {
      this.unsub();
    }
  }

  componentWillUnmount() {
    const { currency } = this.props;
    if (currency && byFamilyStepImport[currency.family]) {
      return;
    }
    this.unsub();
  }

  scanSubscription: Subscription | null = null;
  unsub = () => {
    if (this.scanSubscription) {
      this.scanSubscription.unsubscribe();
    }
  };

  startScanAccountsDevice() {
    this.unsub();
    const { currency, device, setScanStatus, setScannedAccounts, blacklistedTokenIds } = this.props;
    if (!currency || !device) return;
    const mainCurrency = currency.type === "TokenCurrency" ? currency.parentCurrency : currency;
    try {
      const bridge = getCurrencyBridge(mainCurrency);

      // will be set to false if an existing account is found
      let onlyNewAccounts = true;
      const syncConfig = {
        paginationConfig: {
          operations: 20,
        },
        blacklistedTokenIds,
      };
      this.scanSubscription = concat(
        from(prepareCurrency(mainCurrency)).pipe(ignoreElements()),
        bridge.scanAccounts({
          currency: mainCurrency,
          deviceId: device.deviceId,
          syncConfig,
        }),
      )
        .pipe(
          filter(e => e.type === "discovered"),
          map(e => e.account),
        )
        .subscribe({
          next: account => {
            const { scannedAccounts, checkedAccountsIds, existingAccounts } = this.props;
            const hasAlreadyBeenScanned = !!scannedAccounts.find(a => account.id === a.id);
            const hasAlreadyBeenImported = !!existingAccounts.find(a => account.id === a.id);
            const isNewAccount = isAccountEmpty(account);
            if (!isNewAccount && !hasAlreadyBeenImported) {
              onlyNewAccounts = false;
            }
            if (!hasAlreadyBeenScanned) {
              setScannedAccounts({
                scannedAccounts: [...scannedAccounts, account],
                checkedAccountsIds: onlyNewAccounts
                  ? hasAlreadyBeenImported || checkedAccountsIds.length > 0
                    ? checkedAccountsIds
                    : [account.id]
                  : !hasAlreadyBeenImported && !isNewAccount
                  ? uniq([...checkedAccountsIds, account.id])
                  : checkedAccountsIds,
              });
            }
          },
          complete: () => {
            setScanStatus("finished");
          },
          error: err => {
            logger.critical(err);
            const error = remapTransportError(err, currency.name);
            setScanStatus("error", error);
          },
        });
    } catch (err) {
      setScanStatus("error", err as Error);
    }
  }

  handleRetry = () => {
    this.unsub();
    this.props.resetScanState();
    this.startScanAccountsDevice();
  };

  handleToggleAccount = (account: Account) => {
    const { checkedAccountsIds, setScannedAccounts } = this.props;
    const isChecked = checkedAccountsIds.find(id => id === account.id) !== undefined;
    if (isChecked) {
      setScannedAccounts({
        checkedAccountsIds: checkedAccountsIds.filter(id => id !== account.id),
      });
    } else {
      setScannedAccounts({
        checkedAccountsIds: [...checkedAccountsIds, account.id],
      });
    }
  };

  handleSelectAll = (accountsToSelect: Account[]) => {
    const { setScannedAccounts, checkedAccountsIds } = this.props;
    setScannedAccounts({
      checkedAccountsIds: uniq(checkedAccountsIds.concat(accountsToSelect.map(a => a.id))),
    });
  };

  handleUnselectAll = (accountsToRemove: Account[]) => {
    const { setScannedAccounts, checkedAccountsIds } = this.props;
    setScannedAccounts({
      checkedAccountsIds: checkedAccountsIds.filter(id => !accountsToRemove.some(a => id === a.id)),
    });
  };

  renderLegacyAccountsToggle() {
    const { currency } = this.props;
    if (!currency) return null;
    const { showAllCreatedAccounts } = this.state;
    return (
      <Box ml="auto" mr={3}>
        <Box color="palette.text.shade60" horizontal alignItems="center">
          <Text fontSize={2}>
            <Trans i18nKey="addAccounts.createNewAccount.showAllAddressTypes" />
          </Text>
          <ToolTip
            content={
              <Trans
                i18nKey="addAccounts.createNewAccount.showAllAddressTypesTooltip"
                values={{
                  family: currency.name,
                }}
              />
            }
          >
            <Box mx={1}>
              <InfoCircle size={14} />
            </Box>
          </ToolTip>
          <Switch
            isChecked={showAllCreatedAccounts}
            small
            onChange={() =>
              this.setState({
                showAllCreatedAccounts: !showAllCreatedAccounts,
              })
            }
          />
        </Box>
      </Box>
    );
  }

  render() {
    const {
      scanStatus,
      currency,
      err,
      scannedAccounts,
      checkedAccountsIds,
      existingAccounts,
      setAccountName,
      editedNames,
      t,
    } = this.props;
    if (!currency) return null;
    const mainCurrency = currency.type === "TokenCurrency" ? currency.parentCurrency : currency;

    // Find accounts that are (scanned && !existing && !used)
    const newAccountSchemes = scannedAccounts
      .filter(a1 => !existingAccounts.map(a2 => a2.id).includes(a1.id) && !a1.used)
      .map(a => a.derivationMode);
    const preferredNewAccountScheme =
      newAccountSchemes && newAccountSchemes.length > 0 ? newAccountSchemes[0] : undefined;

    // custom family UI for StepImport
    const CustomStepImport = byFamilyStepImport[currency.family];
    if (CustomStepImport) {
      if (CustomStepImport.StepImport) {
        return <CustomStepImport.StepImport {...this.props} />;
      }
      return <CustomStepImport {...this.props} />;
    }

    if (err) {
      return (
        <ErrorDisplay
          error={err}
          withExportLogs={err.name !== "SatStackDescriptorNotImported"}
          supportLink={urls.syncErrors}
        />
      );
    }
    const currencyName = mainCurrency ? mainCurrency.name : "";
    const { sections, alreadyEmptyAccount } = groupAddAccounts(existingAccounts, scannedAccounts, {
      scanning: scanStatus === "scanning",
      preferredNewAccountSchemes: this.state.showAllCreatedAccounts
        ? undefined
        : [preferredNewAccountScheme!],
    });
    let creatable;
    const NoAssociatedAccounts = byFamilyNoAssociatedAccounts[mainCurrency.family as keyof typeof byFamily];
    if (alreadyEmptyAccount) {
      creatable = (
        <Trans i18nKey="addAccounts.createNewAccount.noOperationOnLastAccount" parent="div">
          {" "}
          <Text ff="Inter|SemiBold" color="palette.text.shade100">
            {alreadyEmptyAccount.name}
          </Text>{" "}
        </Trans>
      );
    } else if (NoAssociatedAccounts) {
      // custom family UI for "no associated accounts"
      creatable = <NoAssociatedAccounts {...this.props} />;
    } else {
      creatable = (
        <Trans i18nKey="addAccounts.createNewAccount.noAccountToCreate" parent="div">
          {" "}
          <Text ff="Inter|SemiBold" color="palette.text.shade100">
            {currencyName}
          </Text>{" "}
        </Trans>
      );
    }
    const emptyTexts = {
      importable: t("addAccounts.noAccountToImport", {
        currencyName,
      }),
      creatable,
    };
    return (
      <>
        <TrackPage category="AddAccounts" name="Step3" currencyName={currencyName} />
        <Box mt={-4}>
          {sections.map(({ id, selectable, defaultSelected, data, supportLink }, i) => {
            const hasMultipleSchemes =
              id === "creatable" &&
              newAccountSchemes &&
              newAccountSchemes.length > 1 &&
              data.length > 0 &&
              scanStatus !== "scanning";
            return (
              <SectionAccounts
                currency={currency}
                defaultSelected={defaultSelected}
                key={id}
                title={t(`addAccounts.sections.${id}.title`, {
                  count: data.length,
                })}
                emptyText={emptyTexts[id as keyof typeof emptyTexts]}
                accounts={data}
                autoFocusFirstInput={selectable && i === 0}
                hideAmount={id === "creatable"}
                supportLink={supportLink}
                checkedIds={!selectable ? undefined : checkedAccountsIds}
                onToggleAccount={!selectable ? undefined : this.handleToggleAccount}
                setAccountName={!selectable ? undefined : setAccountName}
                editedNames={!selectable ? undefined : editedNames}
                onSelectAll={!selectable ? undefined : this.handleSelectAll}
                onUnselectAll={!selectable ? undefined : this.handleUnselectAll}
                ToggleAllComponent={hasMultipleSchemes && this.renderLegacyAccountsToggle()}
              />
            );
          })}

          {scanStatus === "scanning" ? (
            <LoadingRow>
              <Spinner color="palette.text.shade60" size={16} />
              <Box ml={2} ff="Inter|Regular" color="palette.text.shade60" fontSize={4}>
                {t("common.sync.syncing")}
              </Box>
            </LoadingRow>
          ) : null}
        </Box>
      </>
    );
  }
}
export default StepImport;
export const StepImportFooter = (props: StepProps) => {
  const {
    transitionTo,
    setScanStatus,
    scanStatus,
    onClickAdd,
    onCloseModal,
    checkedAccountsIds,
    scannedAccounts,
    currency,
    err,
    t,
  } = props;
  const dispatch = useDispatch();
  const willCreateAccount = checkedAccountsIds.some(id => {
    const account = scannedAccounts.find(a => a.id === id);
    return account && isAccountEmpty(account);
  });
  const willAddAccounts = checkedAccountsIds.some(id => {
    const account = scannedAccounts.find(a => a.id === id);
    return account && !isAccountEmpty(account);
  });
  const count = checkedAccountsIds.length;
  const willClose = !willCreateAccount && !willAddAccounts;
  const isHandledError = err && err.name === "SatStackDescriptorNotImported";
  const ctaWording =
    scanStatus === "scanning"
      ? t("common.sync.syncing")
      : willClose
      ? t("common.close")
      : t("addAccounts.cta.add", {
          count,
        });
  const onClick = willClose
    ? onCloseModal
    : async () => {
        await onClickAdd();
        transitionTo("finish");
      };
  const goFullNode = () => {
    onCloseModal();
    dispatch(openModal("MODAL_BITCOIN_FULL_NODE", { skipNodeSetup: true }));
  };

  // custom family UI for StepImportFooter
  if (currency) {
    const CustomStepImport = byFamilyStepImport[currency.family];
    if (CustomStepImport && CustomStepImport.StepImportFooter) {
      return <CustomStepImport.StepImportFooter {...props} />;
    }
  }

  return (
    <>
      <Box grow>{currency && <CurrencyBadge currency={currency} />}</Box>
      {scanStatus === "error" &&
        (isHandledError ? (
          <Button data-test-id={"add-accounts-full-node-reconfigure"} primary onClick={goFullNode}>
            {t("addAccounts.fullNodeConfigure")}
          </Button>
        ) : (
          <>
            <RetryButton
              data-test-id={"add-accounts-import-retry-button"}
              primary
              onClick={() => setScanStatus("scanning")}
            />
          </>
        ))}
      {scanStatus === "scanning" && (
        <Button
          data-test-id={"add-accounts-import-stop-button"}
          onClick={() => setScanStatus("finished")}
        >
          {t("common.stop")}
        </Button>
      )}

      {isHandledError || scanStatus === "error" ? null : (
        <Button
          data-test-id={"add-accounts-import-add-button"}
          primary
          disabled={scanStatus !== "finished"}
          onClick={onClick}
        >
          {ctaWording}
        </Button>
      )}
    </>
  );
};
