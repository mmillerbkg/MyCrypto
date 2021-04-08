import React, { useEffect, useState } from 'react';

import styled from 'styled-components';

import { Banner, Box, Button, Icon, Spinner, Tooltip, Typography } from '@components';
import { DWAccountDisplay, ExtendedDPath } from '@services';
import { BREAK_POINTS, COLORS, SPACING } from '@theme';
import { Trans } from '@translations';
import { BannerType, DPath, ExtendedAsset, Network } from '@types';
import { accountsToCSV, bigify, useScreenSize } from '@utils';
import { prop, uniqBy } from '@vendor';

import { Downloader } from '../../Downloader';
import DeterministicTable, { ITableAccounts, TableAccountDisplay } from './HDWTable';

const MAX_EMPTY_ADDRESSES = 5;

const TableWrapper = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
`;

const StatusBar = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-evenly;
  padding-top: 42px;
  border-top: 1px solid ${COLORS.GREY_ATHENS};
  @media screen and (max-width: ${BREAK_POINTS.SCREEN_SM}) {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100vw;
    flex-direction: column;
    background: white;
    box-shadow: 0px -1px 4px rgba(186, 186, 186, 0.25);
    border-radius: 1.32522px;
    padding: ${SPACING.SM};
    justify-content: space-between;
  }
`;

const StatusWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 65%;
  @media screen and (max-width: ${BREAK_POINTS.SCREEN_SM}) {
    width: 100%;
    text-align: center;
    margin-bottom: ${SPACING.BASE};
  }
`;

const IconWrapper = styled.div`
  margin-right: 17px;
  display: flex;
  align-items: center;
`;

const SDownloader = styled(Downloader)`
  color: ${COLORS.BLUE_MYC};
  cursor: pointer;
  font-weight: bold;
  &:hover {
    color: ${COLORS.BLUE_LIGHT_DARKISH};
  }
`;

export const filterZeroBalanceAccounts = (accounts: DWAccountDisplay[]) =>
  accounts.filter(({ balance }) => balance && bigify(balance).isZero());

interface HDWListProps {
  scannedAccounts: DWAccountDisplay[];
  asset: ExtendedAsset;
  isCompleted: boolean;
  network: Network;
  displayEmptyAddresses: boolean;
  selectedDPath: DPath;
  onScanMoreAddresses(dpath: ExtendedDPath): void;
  onUnlock(param: any): void;
  handleUpdate(asset: ExtendedAsset): void;
}

export default function HDWList({
  scannedAccounts,
  asset,
  isCompleted,
  network,
  displayEmptyAddresses,
  selectedDPath,
  onScanMoreAddresses,
  onUnlock,
  handleUpdate
}: HDWListProps) {
  const { isMobile } = useScreenSize();

  const [tableAccounts, setTableAccounts] = useState({} as ITableAccounts);

  const accountsToUse = uniqBy(prop('address'), scannedAccounts);
  // setTableAccounts to be accountsToUse on update with isDefault set if it isn't already set
  // and if accountsToUse is cleared (occurs when re-scanning all accounts or when changing asset), refresh tableAccounts
  useEffect(() => {
    if (accountsToUse.length === 0 && Object.keys(tableAccounts).length !== 0) {
      setTableAccounts({} as ITableAccounts);
    } else {
      const tableAccs = accountsToUse.reduce((acc, idx) => {
        acc[idx.address] = tableAccounts[idx.address] || {
          ...idx,
          isSelected: (idx.balance && !bigify(idx.balance).isZero()) || false
        };
        return acc;
      }, tableAccounts);
      setTableAccounts(tableAccs);
    }
  }, [accountsToUse]);

  const selectedAccounts = Object.values(tableAccounts).filter(({ isSelected }) => isSelected);
  const emptySelectedAccounts = filterZeroBalanceAccounts(selectedAccounts);
  const handleSubmit = () => {
    onUnlock(selectedAccounts);
  };

  const handleSelection = (account: TableAccountDisplay) => {
    if (account.isSelected) {
      setTableAccounts({
        ...tableAccounts,
        [account.address]: {
          ...account,
          isSelected: !account.isSelected
        }
      });
      return;
    }
    // disallows selecting an account that is empty if MAX_EMPTY_ADDRESSES is already met
    if (
      emptySelectedAccounts.length >= MAX_EMPTY_ADDRESSES &&
      bigify(account.balance!).isEqualTo(0)
    )
      return;
    setTableAccounts({
      ...tableAccounts,
      [account.address]: {
        ...account,
        isSelected: !account.isSelected
      }
    });
  };
  const csv = accountsToCSV(scannedAccounts, asset);
  return (
    <Box variant="columnAlign" width="800px" justifyContent="center">
      <Box
        maxHeight="32px"
        height="32px"
        width="100%"
        style={{ visibility: !displayEmptyAddresses ? 'hidden' : 'visible' }}
      >
        <Banner
          type={BannerType.ANNOUNCEMENT}
          displayIcon={false}
          value={
            <Trans
              id="DETERMINISTIC_SCANNING_EMPTY_ADDR"
              variables={{
                $count: () => emptySelectedAccounts.length,
                $total: () => MAX_EMPTY_ADDRESSES
              }}
            />
          }
        />
      </Box>
      <TableWrapper>
        <DeterministicTable
          isCompleted={isCompleted}
          accounts={tableAccounts}
          displayEmptyAddresses={displayEmptyAddresses}
          selectedDPath={selectedDPath}
          network={network}
          asset={asset}
          onSelect={handleSelection}
          handleUpdate={handleUpdate}
          onScanMoreAddresses={onScanMoreAddresses}
          csv={csv}
        />
      </TableWrapper>
      <StatusBar>
        {isCompleted && !!accountsToUse.length && (
          <StatusWrapper>
            <IconWrapper>
              <Icon type="confirm" width="20px" />
            </IconWrapper>
            <Typography>
              <Trans
                id="DETERMINISTIC_SCANNING_STATUS_DONE"
                variables={{
                  $asset: () => asset.ticker,
                  $total: () => scannedAccounts.length,
                  $network: () => network.name
                }}
              />{' '}
              <Trans id="DETERMINISTIC_SEE_SUMMARY" />{' '}
              <SDownloader data={csv} fileName="accounts.csv" mime="text/csv">
                <Trans id="DETERMINISTIC_ALTERNATIVES_5" />
              </SDownloader>
              .
            </Typography>
          </StatusWrapper>
        )}
        {isCompleted && !accountsToUse.length && (
          <StatusWrapper>
            <IconWrapper>
              <Icon type="info-small" />
            </IconWrapper>
            <Typography>
              <Trans
                id="DETERMINISTIC_SCANNING_STATUS_EMPTY"
                variables={{ $asset: () => asset.ticker }}
              />
            </Typography>
          </StatusWrapper>
        )}
        {!isCompleted && (
          <StatusWrapper>
            <IconWrapper>
              <Spinner color="brand" size={1} />
            </IconWrapper>
            <div>
              <Trans
                id="DETERMINISTIC_SCANNING_STATUS_RUNNING"
                variables={{
                  $total: () => scannedAccounts.length,
                  $network: () => network.name
                }}
              />{' '}
              <Tooltip
                tooltip={
                  <>
                    <Trans
                      id="DETERMINISTIC_CSV"
                      variables={{ $total: () => scannedAccounts.length }}
                    />{' '}
                    <SDownloader data={csv} fileName="accounts.csv" mime="text/csv">
                      <Trans id="DETERMINISTIC_ALTERNATIVES_5" />
                    </SDownloader>
                    .
                  </>
                }
              />
            </div>
          </StatusWrapper>
        )}
        <div>
          <Button onClick={handleSubmit} disabled={!selectedAccounts.length} fullwidth={isMobile}>
            <Trans
              id="DETERMINISTIC_ACCOUNT_LIST_ADD"
              variables={{
                $total: () => (selectedAccounts.length ? selectedAccounts.length : ''),
                $plural: () => (selectedAccounts.length > 1 ? 's' : '')
              }}
            />
          </Button>
        </div>
      </StatusBar>
    </Box>
  );
}

// @todo - sorting
// interface ITableFullHDWType {
//   account: DWAccountDisplay;
//   index: number;
//   label: string;
//   total: number;
//   addressCard: ExtendedAddressBook;
// }

// type TSortFunction = (a: ITableFullHDWType, b: ITableFullHDWType) => number;
// const getSortingFunction = (sortKey: ISortTypes): TSortFunction => {
//   switch (sortKey) {
// 		default:
//     case 'value':
//       return (a: ITableFullHDWType, b: ITableFullHDWType) => b.total - a.total;
//     case 'value-reverse':
//       return (a: ITableFullHDWType, b: ITableFullHDWType) => a.total - b.total;
//     case 'dpath':
//       return (a: ITableFullHDWType, b: ITableFullHDWType) => a.label.localeCompare(b.label);
//     case 'dpath-reverse':
//       return (a: ITableFullHDWType, b: ITableFullHDWType) => b.label.localeCompare(a.label);
//     case 'address':
//       return (a: ITableFullHDWType, b: ITableFullHDWType) =>
//         a.account.address.localeCompare(b.account.address);
//     case 'address-reverse':
//       return (a: ITableFullHDWType, b: ITableFullHDWType) =>
//         b.account.address.localeCompare(a.account.address);
//   }
// };