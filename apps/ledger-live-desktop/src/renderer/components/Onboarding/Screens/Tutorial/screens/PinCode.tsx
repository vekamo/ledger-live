import React from "react";
import { useTranslation, Trans } from "react-i18next";
import { Title, SubTitle, AsideFooter, CheckStep, Column, IllustrationContainer } from "../shared";
import nanoPinCode from "../assets/nanoPinCode.png";

type Props = {
  toggleUserChosePinCodeHimself: () => void;
  userChosePinCodeHimself: boolean;
};

export function PinCode({ toggleUserChosePinCodeHimself, userChosePinCodeHimself }: Props) {
  const { t } = useTranslation();

  return (
    <Column>
      <Title>{t("onboarding.screens.tutorial.screens.pinCode.title")}</Title>
      <SubTitle>{t("onboarding.screens.tutorial.screens.pinCode.paragraph")}</SubTitle>
      <CheckStep
        data-test-id="v3-private-pin-code-checkbox"
        checked={userChosePinCodeHimself}
        onClick={toggleUserChosePinCodeHimself}
        label={t("onboarding.screens.tutorial.screens.pinCode.disclaimer")}
      />
    </Column>
  );
}

PinCode.Illustration = <IllustrationContainer width="240px" height="245px" src={nanoPinCode} />;

const Footer = (props: unknown) => {
  const { t } = useTranslation();
  return (
    <AsideFooter {...props} text={t("onboarding.screens.tutorial.screens.pinCode.help.descr")} />
  );
};

PinCode.Footer = Footer;

PinCode.continueLabel = (
  <Trans i18nKey="onboarding.screens.tutorial.screens.pinCode.buttons.next" />
);
