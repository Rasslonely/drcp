
/**
 * Pinata IPFS Upload Service
 * 
 * Note: These should be provided via environment variables in a production app.
 * For this hackathon demo, we will check for their existence and fallback gracefully.
 */

// Placeholder for Pinata JWT or API Keys
const PINATA_JWT = ""; // Add your Pinata JWT here
const PINATA_API_KEY = "";
const PINATA_SECRET_API_KEY = "";

/**
 * Uploads a file (photo from URI) to Pinata IPFS.
 * 
 * @param uri The local URI of the photo to upload
 * @param fileName Optional filename for the upload
 * @returns The IPFS CID (hash) of the uploaded file
 */
export const uploadToPinata = async (uri: string, fileName: string = "proof-capture.jpg") => {
  // Graceful fallback if no keys are provided
  if (!PINATA_JWT && (!PINATA_API_KEY || !PINATA_SECRET_API_KEY)) {
    console.warn("Pinata API keys not found. Using hackathon fallback (mock CID).");
    // Mock CID for demo purposes if no API key is available
    return "QmYwAPJzv5CZsnA6ULBX3n6L678910MockProofCID";
  }

  try {
    const formData = new FormData();
    
    // In React Native, we need to format the file object for FormData
    // @ts-ignore
    formData.append("file", {
      uri: uri,
      type: "image/jpeg",
      name: fileName,
    });

    const metadata = JSON.stringify({
      name: fileName,
      keyvalues: {
        project: "DisasterProtocol",
        type: "ProofOfTask"
      }
    });
    formData.append("pinataMetadata", metadata);

    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append("pinataOptions", options);

    const useJwt = !!PINATA_JWT;
    const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";
    
    const headers: Record<string, string> = {};
    if (useJwt) {
      headers["Authorization"] = `Bearer ${PINATA_JWT}`;
    } else {
      headers["pinata_api_key"] = PINATA_API_KEY;
      headers["pinata_secret_api_key"] = PINATA_SECRET_API_KEY;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.details || errorData.error || "Failed to upload to Pinata");
    }

    const result = await response.json();
    return result.IpfsHash; // This is the CID
  } catch (error) {
    console.error("Pinata upload error:", error);
    throw error;
  }
};
