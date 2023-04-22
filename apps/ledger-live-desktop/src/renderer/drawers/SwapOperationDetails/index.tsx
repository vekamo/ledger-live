import {
  getAccountCurrency,
  getAccountName,
  getAccountUnit,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import { isSwapOperationPending } from "@ledgerhq/live-common/exchange/swap/index";
import { MappedSwapOperation } from "@ledgerhq/live-common/exchange/swap/types";
import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { getDefaultExplorerView, getTransactionExplorer } from "@ledgerhq/live-common/explorers";
import uniq from "lodash/uniq";
import React, { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import { urls } from "~/config/urls";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import CopyWithFeedback from "~/renderer/components/CopyWithFeedback";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import Ellipsis from "~/renderer/components/Ellipsis";
import FormattedDate from "~/renderer/components/FormattedDate";
import FormattedVal from "~/renderer/components/FormattedVal";
import Link from "~/renderer/components/Link";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import Text from "~/renderer/components/Text";
import Tooltip from "~/renderer/components/Tooltip";
import { DataList } from "~/renderer/drawers/OperationDetails";
import {
  B,
  GradientHover,
  OpDetailsData,
  OpDetailsSection,
  OpDetailsTitle,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import useTheme from "~/renderer/hooks/useTheme";
import IconArrowDown from "~/renderer/icons/ArrowDown";
import IconClock from "~/renderer/icons/Clock";
import IconExclamationCircle from "~/renderer/icons/ExclamationCircle";
import IconSwap from "~/renderer/icons/Swap";
import { openURL } from "~/renderer/linking";
import { shallowAccountsSelector } from "~/renderer/reducers/accounts";
import { getStatusColor } from "~/renderer/screens/exchange/Swap2/History/OperationRow";
import { rgba } from "~/renderer/styles/helpers";
const Value = styled(Box).attrs(() => ({
  fontSize: 4,
  color: "palette.text.shade50",
  ff: "Inter|Medium",
}))<{ status?: string }>`
  flex: 1;
  ${p => (p.status ? `color:${getStatusColor(p.status, p.theme)};` : "")}
`;
const Status = styled.div<{ status: string }>`
  height: 36px;
  width: 36px;
  display: flex;
  position: relative;
  align-items: center;
  justify-content: center;
  align-self: center;
  border-radius: 50%;
  background: ${p => rgba(getStatusColor(p.status, p.theme), 0.1)};
  & > * {
    color: ${p => getStatusColor(p.status, p.theme)};
  }
`;
const WrapperClock = styled(Box).attrs(() => ({
  bg: "palette.background.paper",
  color: "palette.text.shade60",
}))`
  border-radius: 50%;
  position: absolute;
  bottom: -2px;
  right: -2px;
  padding: 3px;
`;
const SelectableTextWrapper = styled(Box).attrs(p => ({
  ff: "Inter",
  color: p.color || "palette.text.shade80",
  fontSize: 4,
  relative: true,
}))`
  width: 100%;

  ${GradientHover} {
    display: none;
  }

  &:hover ${GradientHover} {
    display: flex;
    & > * {
      cursor: pointer;
    }
  }

  &:hover ${Value} {
    color: ${p => p.theme.colors.palette.text.shade100};
    font-weight: 400;
  }
}
`;
const SwapOperationDetails = ({
  mappedSwapOperation,
  onClose,
}: {
  mappedSwapOperation: MappedSwapOperation;
  onClose: () => void;
}) => {
  const {
    fromAccount,
    toAccount,
    operation,
    provider,
    swapId,
    status,
    fromAmount,
    toAmount,
  } = mappedSwapOperation;
  const history = useHistory();
  const fromUnit = getAccountUnit(fromAccount);
  const fromCurrency = getAccountCurrency(fromAccount);
  const toUnit = getAccountUnit(toAccount);
  const toCurrency = getAccountCurrency(toAccount);
  const accounts = useSelector(shallowAccountsSelector);
  const normalisedFromAmount = fromAmount.times(-1);
  const theme = useTheme();
  const statusColor = getStatusColor(status, theme);
  const { t } = useTranslation();
  const url =
    fromCurrency.type === "CryptoCurrency" &&
    getTransactionExplorer(getDefaultExplorerView(fromCurrency), operation.hash);
  const openAccount = useCallback(
    account => {
      const parentAccount =
        account.type !== "Account" ? accounts.find(a => a.id === account.parentId) : null;
      const mainAccount = getMainAccount(account, parentAccount);
      const url = `/account/${mainAccount.id}/${parentAccount ? account.id : ""}`;
      setTrackingSource("swap operation details");
      history.push({
        pathname: url,
      });
      onClose();
    },
    [accounts, history, onClose],
  );

  // Fixme, at this point it might be a good idea to refactor into the op details modal
  const senders = uniq(operation.senders);
  const recipients = uniq(operation.recipients);
  const currencyName = fromCurrency
    ? fromCurrency.type === "TokenCurrency"
      ? fromCurrency.parentCurrency.name
      : fromCurrency.name
    : undefined;
  return (
    <Box flow={3} px={20} mt={20}>
      <Status status={status}>
        <IconSwap size={18} />
        {isSwapOperationPending(status) ? (
          <WrapperClock>
            <IconClock size={16} />
          </WrapperClock>
        ) : null}
      </Status>
      <Text ff="Inter|SemiBold" textAlign="center" fontSize={4} color="palette.text.shade60" my={1}>
        <Trans i18nKey="swap.operationDetailsModal.title" />
      </Text>
      <Box my={2} alignItems="center">
        <Box selectable>
          <FormattedVal
            color={normalisedFromAmount.isNegative() ? "palette.text.shade100" : undefined}
            unit={fromUnit}
            alwaysShowSign
            showCode
            val={normalisedFromAmount}
            fontSize={6}
            disableRounding
          />
        </Box>
        <Box my={1} color={"palette.text.shade50"}>
          <IconArrowDown size={16} />
        </Box>

        <Box selectable>
          <FormattedVal
            unit={toUnit}
            alwaysShowSign
            showCode
            val={toAmount}
            fontSize={6}
            disableRounding
            color={statusColor}
          />
        </Box>
      </Box>
      {url ? (
        <Box m={0} ff="Inter|SemiBold" horizontal justifyContent="center" fontSize={4} mb={1}>
          <LinkWithExternalIcon
            fontSize={4}
            onClick={() =>
              openURL(url, "viewSwapOperationInExplorer", {
                currencyId: currencyName,
              })
            }
            label={t("operationDetails.viewOperation")}
          />
        </Box>
      ) : null}
      <OpDetailsSection>
        <OpDetailsTitle>
          <Trans i18nKey="swap.operationDetailsModal.provider" />
        </OpDetailsTitle>
        <OpDetailsData>
          <LinkWithExternalIcon
            fontSize={12}
            onClick={() =>
              openURL(urls.swap.providers[provider as keyof typeof urls.swap.providers]?.main)
            }
          >
            {getProviderName(provider)}
          </LinkWithExternalIcon>
        </OpDetailsData>
      </OpDetailsSection>
      <OpDetailsSection>
        <OpDetailsTitle>
          <Trans i18nKey="swap.operationDetailsModal.txid" />
        </OpDetailsTitle>
        <OpDetailsData>
          <Box>
            <SelectableTextWrapper selectable>
              <Value data-test-id="details-swap-id">{swapId}</Value>
              <GradientHover>
                <CopyWithFeedback text={swapId} />
              </GradientHover>
            </SelectableTextWrapper>
          </Box>
        </OpDetailsData>
      </OpDetailsSection>
      <OpDetailsSection>
        <OpDetailsTitle>
          <Trans i18nKey="swap.operationDetailsModal.status" />
        </OpDetailsTitle>
        <OpDetailsData>
          <Box horizontal alignItems="center">
            <Value
              mr={1}
              status={status}
              style={{
                textTransform: "capitalize",
              }}
            >
              {status}
            </Value>
            <Tooltip
              content={
                <Box
                  style={{
                    maxWidth: 180,
                  }}
                >
                  <Trans i18nKey={`swap.operationDetailsModal.statusTooltips.${status}`} />
                </Box>
              }
            >
              <IconExclamationCircle size={12} color={statusColor} />
            </Tooltip>
          </Box>
        </OpDetailsData>
      </OpDetailsSection>
      <OpDetailsSection>
        <OpDetailsTitle>
          <Trans i18nKey="swap.operationDetailsModal.date" />
        </OpDetailsTitle>
        <OpDetailsData>
          <Box>
            <FormattedDate date={operation.date} format="L" />
          </Box>
        </OpDetailsData>
      </OpDetailsSection>
      <B />
      <OpDetailsSection>
        <OpDetailsTitle>
          <Trans i18nKey="swap.operationDetailsModal.from" />
        </OpDetailsTitle>
        <OpDetailsData>
          <Box horizontal alignItems={"center"}>
            <Box mr={1} alignItems={"center"}>
              <CryptoCurrencyIcon size={16} currency={fromCurrency} />
            </Box>
            <Box flex={1} color={"palette.text.shade100"}>
              <Ellipsis>
                <Link onClick={() => openAccount(fromAccount)}>{getAccountName(fromAccount)}</Link>
              </Ellipsis>
            </Box>
          </Box>
        </OpDetailsData>
      </OpDetailsSection>
      <OpDetailsSection>
        <OpDetailsTitle>
          <Trans i18nKey="swap.operationDetailsModal.initialAmount" />
        </OpDetailsTitle>
        <OpDetailsData>
          <Box>
            <FormattedVal
              unit={fromUnit}
              showCode
              val={fromAmount}
              disableRounding
              color={"palette.text.shade50"}
            />
          </Box>
        </OpDetailsData>
      </OpDetailsSection>
      <OpDetailsSection>
        <OpDetailsTitle>
          <Trans i18nKey="swap.operationDetailsModal.fromAddress" count={senders?.length} />
        </OpDetailsTitle>
        <OpDetailsData>
          <DataList lines={senders} t={t} />
        </OpDetailsData>
      </OpDetailsSection>
      <B />
      <OpDetailsSection>
        <OpDetailsTitle>
          <Trans i18nKey="swap.operationDetailsModal.to" />
        </OpDetailsTitle>
        <OpDetailsData>
          <Box horizontal alignItems={"center"}>
            <Box mr={1} alignItems={"center"}>
              <CryptoCurrencyIcon size={16} currency={toCurrency} />
            </Box>
            <Box flex={1} color={"palette.text.shade100"}>
              <Ellipsis>
                <Link onClick={() => openAccount(toAccount)}>{getAccountName(toAccount)}</Link>
              </Ellipsis>
            </Box>
          </Box>
        </OpDetailsData>
      </OpDetailsSection>
      <OpDetailsSection>
        <OpDetailsTitle>
          <Trans i18nKey="swap.operationDetailsModal.creditedAmount" />
        </OpDetailsTitle>
        <OpDetailsData>
          <Box>
            <FormattedVal
              unit={toUnit}
              showCode
              val={toAmount}
              fontSize={6}
              disableRounding
              color={"palette.text.shade50"}
            />
          </Box>
        </OpDetailsData>
      </OpDetailsSection>
      <OpDetailsSection>
        <OpDetailsTitle>
          <Trans i18nKey="swap.operationDetailsModal.toProvider" />
        </OpDetailsTitle>
        <OpDetailsData>
          <DataList lines={recipients} t={t} />
        </OpDetailsData>
      </OpDetailsSection>
    </Box>
  );
};
export default SwapOperationDetails;
