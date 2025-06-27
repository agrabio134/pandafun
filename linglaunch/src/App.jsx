import { useState, useEffect } from 'react';
import Solflare from '@solflare-wallet/sdk';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import { Metaplex } from '@metaplex-foundation/js';
import './App.css';

function App() {
  const [wallet, setWallet] = useState(null);
  const [publicKey, setPublicKey] = useState(null);
  const [connected, setConnected] = useState(false);
  const [walletReady, setWalletReady] = useState(false);

  const network = 'https://api.devnet.solana.com';
  const connection = new Connection(network, 'confirmed');
  const metaplex = Metaplex.make(connection);

  const [tokenDetails, setTokenDetails] = useState({
    name: '',
    symbol: '',
    supply: '',
    initialPrice: '',
    description: '',
    image: null,
    xLink: '',
    telegramLink: '',
    websiteLink: '',
  });

  useEffect(() => {
    // Initialize Solflare Wallet SDK
    const initWallet = async () => {
      if (window.solflare || window.solana) {
        const solflare = new Solflare();
        setWallet(solflare);
        setWalletReady(true);

        // Add event listeners for debugging
        solflare.on('connect', () => {
          console.log('Wallet connected:', solflare.publicKey?.toString());
          setPublicKey(solflare.publicKey ? new PublicKey(solflare.publicKey) : null);
          setConnected(true);
        });
        solflare.on('disconnect', () => {
          console.log('Wallet disconnected');
          setPublicKey(null);
          setConnected(false);
        });

        // Attempt to reconnect if previously connected
        if (solflare.isConnected) {
          await solflare.connect();
        }
      } else {
        console.warn('Wallet not detected. Retrying...');
        const timeout = setTimeout(initWallet, 2000);
        return () => clearTimeout(timeout);
      }
    };
    initWallet();
  }, []);

  const connectWallet = async () => {
    if (!wallet) {
      alert('Wallet not detected. Please install Solflare or Phantom.');
      return;
    }
    try {
      await wallet.connect();
    } catch (error) {
      console.error('Connection failed:', error);
      alert('Failed to connect wallet.');
    }
  };

  const disconnectWallet = async () => {
    if (wallet) {
      await wallet.disconnect();
    }
  };

  const handleInputChange = (e) => {
    const { id, value, files } = e.target;
    setTokenDetails((prev) => ({
      ...prev,
      [id]: files ? files[0] : value,
    }));
  };

  const createToken = async () => {
    const { name, symbol, supply, initialPrice, description, image, xLink, telegramLink, websiteLink } = tokenDetails;

    if (!name || !symbol || !supply || !initialPrice) {
      alert('Please fill in all required fields.');
      return;
    }

    if (!connected || !publicKey || !wallet) {
      alert('Please connect your wallet first.');
      return;
    }

    try {
      const mintKeypair = Keypair.generate();
      const decimals = 9;

      const mint = await createMint(
        connection,
        wallet,
        publicKey,
        null,
        decimals
      );

      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        wallet,
        mint,
        publicKey
      );

      await mintTo(
        connection,
        wallet,
        mint,
        tokenAccount.address,
        publicKey,
        BigInt(parseInt(supply) * 10 ** decimals)
      );

      const metadataUri = await uploadMetadata(name, symbol, description, image, xLink, telegramLink, websiteLink);
      await metaplex.nfts().create({
        uri: metadataUri,
        name,
        symbol,
        sellerFeeBasisPoints: 500,
        creators: [{ address: publicKey, share: 100 }],
        tokenOwner: publicKey,
        mintAddress: mint,
      });

      await setupMeteoraPool(mint, parseFloat(initialPrice));

      alert(`Token "${name}" (${symbol}) created successfully!\nMint Address: ${mint.toBase58()}`);
    } catch (error) {
      console.error('Token creation failed:', error);
      alert('Failed to create token. Check console for details.');
    }
  };

  const uploadMetadata = async (name, symbol, description, image, xLink, telegramLink, websiteLink) => {
    const metadata = {
      name,
      symbol,
      description,
      image: image ? URL.createObjectURL(image) : 'https://via.placeholder.com/150',
      external_url: websiteLink || '',
      attributes: [
        { trait_type: 'X Profile', value: xLink || 'N/A' },
        { trait_type: 'Telegram', value: telegramLink || 'N/A' },
      ],
    };
    return 'https://example.com/metadata.json'; // Replace with actual IPFS/Arweave URI
  };

  const setupMeteoraPool = async (mint, initialPrice) => {
    console.log(`Setting up Meteora pool for mint: ${mint.toBase58()}, initial price: ${initialPrice} SOL`);
    alert('Meteora pool setup is a placeholder. Refer to Meteora docs for full integration.');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="navbar flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img src="/panda-portrait.jpg" alt="LingLaunch Logo" className="w-9 h-9 rounded-full object-cover border-2 border-bamboo-green" />
          <span className="text-2xl font-extrabold">LingLaunch</span>
        </div>
        <div className="flex gap-4 items-center">
          <a href="#home" className="text-sm font-semibold hover:text-bamboo-green transition-colors">Home</a>
          <a href="#tokens" className="text-sm font-semibold hover:text-bamboo-green">Tokens</a>
          <a href="/docs" className="text-sm font-semibold hover:text-bamboo-green transition-colors">Docs</a>
          {walletReady ? (
            connected ? (
              <div className="flex gap-2 items">
                <span className="text-sm font-semibold">{publicKey?.toBase58()?.slice(0, 4)}...{publicKey?.toBase58()?.slice(-4)}</span>
                <button className="WASM-btn" onClick={dropdown}>Disconnect</button>
              </div>
            ) : (
              <button className="WASM-btn" onClick={connectWallet}>Connect Wallet</button>
            )
          ) : (
            <button className="WASM-btn" disabled>Loading...</button>
          )}
        </div>
      </nav>

      <section className="hero-section">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold mb-2 flex items-center justify-center gap-2">
            LingLaunch <span className="text-2xl">🐼</span>
          </h1>
          <p className="text-lg font-medium max-w-sm mx-auto">Launch your Solana instantly with Meteora!</p>
        </div>
      </section>

      <section className="panda-card">
        <h2 className="text-2xl font-extrabold mb-4 text-center">Create Token</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label htmlFor="token-name">Token Name</label>
            <input type="text" id="token-name" placeholder="e.g., LingCoin" onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="token-symbol">Symbol</label>
            <input type="text" id="token-symbol" placeholder="e.g., LING" maxLength="10" onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="token-supply">Total Supply</label>
            <input type="number" id="token-supply" placeholder="e.g., 1000000000" min="1" onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="initial-price">Initial Price (SOL)</label>
            <input type="number" id="initial-price" placeholder="e.g., 0.01" step="0.01" min="0" onChange={handleInputChange} required />
          </div>
          <div className="form-group md:col-span-2">
            <label htmlFor="token-description">Description</label>
            <textarea id="token-description" rows="3" placeholder="Token purpose..." onChange={handleInputChange}></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="token-image">Token Image</label>
            <input type="file" id="token-image" accept="image/*" onChange={handleInputChange} />
          </div>
          <div className="form-group">
            <label htmlFor="x-link">X Profile</label>
            <input type="text" id="x-link" placeholder="e.g., https://x.com/LingDotFun" onChange={handleInputChange} />
          </div>
          <div className="form-group">
            <label htmlFor="telegram-link">Telegram</label>
            <input type="text" id="telegram-link" placeholder="e.g., https://t.me/linglaunch" onChange={handleInputChange} />
          </div>
          <div className="form-group">
            <label htmlFor="website-link">Website</label>
            <input type="text" id="website-link" placeholder="e.g., https://linglaunch.com" onChange={handleInputChange} />
          </div>
        </div>
        <button className="panda-btn w-full mt-4" onClick={createToken} disabled={!connected}>
          <i className="fas fa-rocket"></i> Launch Token
        </button>
        <div className="powered-by">
          <a href="https://meteora.ag" target="_blank" rel="noopener noreferrer">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-39Edxpaw-Tb2OhdSbNIyYPMfuK7HP7wOig&s" alt="Meteora Logo" /> Powered by Meteora Aggregator
          </a>
        </div>
      </section>

      <footer>
        <div className="social-icons">
          <a href="https://x.com/LingDotFun" target="_blank" rel="noopener noreferrer"><i className="fab fa-x fa-lg"></i></a>
          <a href="https://t.me/linglaunch" target="_blank" rel="noopener noreferrer"><i className="fab fa-telegram fa-lg"></i></a>
          <a href="https://linglaunch.com" target="_blank" rel="noopener noreferrer"><i className="fas fa-globe fa-lg"></i></a>
        </div>
        <p className="mt-2">© 2025 LingLaunch. Powered by Solana.</p>
      </footer>
    </div>
  );
}

export default App;