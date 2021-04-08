import React from 'react';

import { ProvidersWrapper } from 'test-utils';

import { ExtendedContentPanel } from '@components';
import { LEDGER_DERIVATION_PATHS } from '@config';
import { fAssets, fDWAccounts, fNetworks } from '@fixtures';
import { noOp } from '@utils';

import { HDWalletProps, default as HDWalletUI } from './HDWallet';

export default {
  title: 'Organisms/HDWallet'
};

const initialProps: HDWalletProps = {
  selectedAsset: fAssets[0],
  scannedAccounts: fDWAccounts,
  isCompleted: true,
  network: fNetworks[0],
  assets: fAssets,
  dpaths: LEDGER_DERIVATION_PATHS,
  assetToUse: fAssets[0],
  selectedDPath: {
    ...fDWAccounts[0].pathItem,
    label: 'Default ETH DPath',
    value: ''
  },
  setSelectedDPath: noOp,
  updateAsset: noOp,
  addDPaths: noOp,
  scanMoreAddresses: noOp,
  handleAssetUpdate: noOp,
  onUnlock: noOp
};

export const HDWallet = () => (
  <ProvidersWrapper>
    <ExtendedContentPanel width="800px">
      <HDWalletUI {...initialProps} />
    </ExtendedContentPanel>
  </ProvidersWrapper>
);