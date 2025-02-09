import React, { PureComponent } from "react";
import Box from "~/renderer/components/Box";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { PortfolioRange } from "@ledgerhq/live-common/portfolio/v2/types";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import styled from "styled-components";
import Header from "~/renderer/screens/accounts/AccountRowItem/Header";
import Balance from "~/renderer/screens/accounts/AccountRowItem/Balance";
import Delta from "~/renderer/screens/accounts/AccountRowItem/Delta";
import Countervalue from "~/renderer/screens/accounts/AccountRowItem/Countervalue";
import Star from "~/renderer/components/Stars/Star";
import { TableRow } from "./TableContainer";
type Props = {
  account: AccountLike;
  nested?: boolean;
  disableRounding?: boolean;
  index: number;
  parentAccount: Account;
  onClick: (b: AccountLike, a: Account) => void;
  range: PortfolioRange;
};
const NestedRow = styled(Box)`
  flex: 1;
  font-weight: 600;
  align-items: center;
  justify-content: flex-start;
  display: flex;
  flex-direction: row;
  cursor: pointer;
  position: relative;
  margin: 0 -20px;
  padding: 0 20px;
  &:last-of-type {
    margin-bottom: 0px;
  }
  :active {
    background: ${p => p.theme.colors.palette.action.hover};
  }
`;
class TokenRow extends PureComponent<Props> {
  onClick = () => {
    const { account, parentAccount, onClick } = this.props;
    onClick(account, parentAccount);
  };

  render() {
    const { account, range, index, nested, disableRounding } = this.props;
    const currency = getAccountCurrency(account);
    const unit = currency.units[0];
    const Row = nested ? NestedRow : TableRow;
    return (
      <Row className="token-row" index={index} onClick={this.onClick} tabIndex="-1">
        <Header nested={nested} account={account} />
        <Balance unit={unit} balance={account.balance} disableRounding={disableRounding} />
        <Countervalue account={account} currency={currency} range={range} />
        <Delta account={account} range={range} />
        <Star
          accountId={account.id}
          parentId={account.type !== "Account" ? account.parentId : undefined}
        />
      </Row>
    );
  }
}
export default TokenRow;
