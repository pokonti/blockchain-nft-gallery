import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import './App.css';

// 1. Your Contract Address
const CONTRACT_ADDRESS = "0x8c1D21f2Fc7c1C6A5F323AB62bCB1229091118F1";

// 2. We use a "Public RPC" for tBNB so we don't rely on Metamask for reading
const TBNB_RPC_URL = "https://data-seed-prebsc-1-s1.binance.org:8545/";

const ABI = [
  "function nextTokenId() view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)"
];

function App() {
  const [nfts, setNfts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    setLoading(true);

    try {
      // --- CHANGE: Use JsonRpcProvider for tBNB ---
      // This forces the app to look at BSC Testnet, regardless of your wallet settings
      const provider = new ethers.JsonRpcProvider(TBNB_RPC_URL);
      
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      
      // Get total count
      // If this fails now, it means the contract address is wrong, not the network.
      const totalString = await contract.nextTokenId();
      const total = Number(totalString);
      
      console.log(`Found ${total} certificates on tBNB`);
      const loadedData = [];

      for (let i = 0; i < total; i++) {
        try {
            const uri = await contract.tokenURI(i);
            
            // Fix IPFS URLs
            let url = uri;
            if (uri.startsWith("ipfs://")) {
                url = uri.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
            } else if (!uri.startsWith("http")) {
                url = `https://gateway.pinata.cloud/ipfs/${uri}`;
            }

            // Fetch JSON
            const response = await fetch(url);
            const metadata = await response.json();
            loadedData.push({ id: i, ...metadata });
        } catch (innerErr) {
            console.warn(`Skipping ID ${i}:`, innerErr);
        }
      }

      setNfts(loadedData);
    } catch (error) {
      console.error("Error fetching from tBNB:", error);
      alert("Error reading from BSC Testnet. Check console.");
    }
    setLoading(false);
  };

  const filteredNFTs = nfts.filter(nft => 
    nft.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (nft.attributes && nft.attributes.some(attr => 
        attr.value?.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

  return (
    <div style={{ fontFamily: "Arial", padding: "40px", textAlign: "center", backgroundColor: "#fafafa", minHeight: "100vh" }}>
      <h1>🎓 University Certificate Gallery</h1>
      <p style={{color: "#666"}}>Connected to: BNB Smart Chain Testnet</p>
      
      <input 
        type="text" 
        placeholder="🔍 Search Student, Program, or Grade..." 
        style={{ padding: "12px", width: "300px", fontSize: "16px", marginBottom: "30px", borderRadius: "5px", border: "1px solid #ccc" }}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {loading && <p>⏳ Loading Certificates from Blockchain...</p>}

      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "20px" }}>
        {filteredNFTs.map((nft) => (
          <div key={nft.id} style={cardStyle}>
            <div style={{background: "#eee", height: "180px", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid #ddd"}}>
                <img 
                    src={nft.image?.startsWith("ipfs") ? nft.image.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/") : nft.image} 
                    alt="cert" 
                    style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} 
                    onError={(e) => {e.target.onerror = null; e.target.src="https://via.placeholder.com/150?text=No+Image"}}
                />
            </div>
            <div style={{ padding: "15px", textAlign: "left" }}>
                <h3 style={{ margin: "0 0 5px 0", color: "#333" }}>{nft.name}</h3>
                <p style={{ color: "#777", fontSize: "14px", margin: "0 0 15px 0" }}>{nft.description}</p>
                
                <div style={{ background: "#f9f9f9", padding: "10px", borderRadius: "5px", fontSize: "13px" }}>
                    {nft.attributes?.map((attr, idx) => (
                        <div key={idx} style={{display:"flex", justifyContent:"space-between", marginBottom:"4px"}}>
                            <strong style={{color:"#555"}}>{attr.trait_type}:</strong> 
                            <span style={{color:"#000"}}>{attr.value}</span>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        ))}
      </div>
      
      {!loading && filteredNFTs.length === 0 && <p>No certificates found.</p>}
    </div>
  );
}

const cardStyle = {
    width: "300px",
    border: "1px solid #e0e0e0",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    background: "white",
    transition: "transform 0.2s"
};

export default App;