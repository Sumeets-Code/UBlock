import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

/**
 * WalletProvider
 *
 * Manages MetaMask connection state globally.
 * Exposes: { account, chainId, isConnected, isConnecting, connect, disconnect, switchToSepolia }
 *
 * The wallet is optional — users who don't have MetaMask can still use the app;
 * the backend operator wallet will pay for their blockchain registration instead.
 */

const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111 in hex

const WalletCtx = createContext(null);

const WalletProvider = ({ children }) => {
  const [account,      setAccount]      = useState(null);
  const [chainId,      setChainId]      = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error,        setError]        = useState(null);

  const isConnected = Boolean(account);
  const isCorrectNetwork = chainId === SEPOLIA_CHAIN_ID;

  // ── Re-hydrate if MetaMask was already connected ────────────────────────
  useEffect(() => {
    if (!window.ethereum) return;

    // Read current state without prompting the user
    window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
      if (accounts.length > 0) setAccount(accounts[0].toLowerCase());
    });
    window.ethereum.request({ method: 'eth_chainId' }).then(setChainId);

    // Listen for user switching accounts or networks
    window.ethereum.on('accountsChanged', accounts => {
      setAccount(accounts[0]?.toLowerCase() || null);
    });
    window.ethereum.on('chainChanged', id => {
      setChainId(id);
    });

    return () => {
      window.ethereum?.removeAllListeners('accountsChanged');
      window.ethereum?.removeAllListeners('chainChanged');
    };
  }, []);

  // ── Connect ──────────────────────────────────────────────────────────────
  const connect = useCallback(async () => {
    setError(null);
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install it from metamask.io');
      return false;
    }
    try {
      setIsConnecting(true);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const chain    = await window.ethereum.request({ method: 'eth_chainId' });
      setAccount(accounts[0].toLowerCase());
      setChainId(chain);
      return true;
    } catch (err) {
      setError(err.code === 4001 ? 'Connection rejected by user.' : err.message);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // ── Disconnect (clears local state; MetaMask keeps its own connection) ───
  const disconnect = useCallback(() => {
    setAccount(null);
    setChainId(null);
  }, []);

  // ── Switch to Sepolia ─────────────────────────────────────────────────────
  const switchToSepolia = useCallback(async () => {
    if (!window.ethereum) return false;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
      return true;
    } catch (err) {
      if (err.code === 4902) {
        // Chain not added yet — add it
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId:         SEPOLIA_CHAIN_ID,
            chainName:       'Sepolia Testnet',
            nativeCurrency:  { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
            rpcUrls:         ['https://rpc.sepolia.org'],
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
          }],
        });
        return true;
      }
      setError(err.message);
      return false;
    }
  }, []);

  return (
    <WalletCtx.Provider value={{
      account,
      chainId,
      isConnected,
      isCorrectNetwork,
      isConnecting,
      error,
      connect,
      disconnect,
      switchToSepolia,
      SEPOLIA_CHAIN_ID,
    }}>
      {children}
    </WalletCtx.Provider>
  );
};

export const useWallet = () => {
  const ctx = useContext(WalletCtx);
  if (!ctx) throw new Error('useWallet must be used inside <WalletProvider>');
  return ctx;
};

export default WalletProvider;
