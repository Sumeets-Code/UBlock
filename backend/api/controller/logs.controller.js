const fetchLogs = async (req, res) => {
  try {
    const { evidenceId } = req.query;
    
    if (!evidenceId) {
      return res.status(400).json({
        success: false,
        error: 'Evidence ID is required'
      });
    }

    const logs = await blockchainService.getAccessLogs(evidenceId);
    return res.json({
      success: true,
      evidenceId,
      accessLogs: logs,
      totalViews: logs.length
    });

  } catch (error) {
    console.error('Logs fetch error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch access logs'
    });
  }
}

export default { fetchLogs };