import Layout from '../components/Layout';

const Reports = () => {
  return (
    <Layout>
      <div className="flex-between mb-4">
        <div>
          <h1 className="text-h1" style={{ fontSize: 24, marginBottom: 4 }}>Reports & Analytics</h1>
          <div className="text-sub">Export data and analyze trends</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
          <h2 className="text-h2" style={{ fontSize: 18, marginBottom: 8 }}>Financial Summary</h2>
          <p className="text-sub mb-4">Export detailed donation and expense records for auditing.</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-primary">Download PDF</button>
            <button className="btn btn-outline">Export CSV</button>
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🧾</div>
          <h2 className="text-h2" style={{ fontSize: 18, marginBottom: 8 }}>Receipt Register</h2>
          <p className="text-sub mb-4">Complete list of all generated receipts, including cancelled and reversed entries.</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-primary">Download PDF</button>
            <button className="btn btn-outline">Export CSV</button>
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
          <h2 className="text-h2" style={{ fontSize: 18, marginBottom: 8 }}>Donor Database</h2>
          <p className="text-sub mb-4">Export donor details, contact information, and contribution history.</p>
          <button className="btn btn-primary">Export CSV</button>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🎪</div>
          <h2 className="text-h2" style={{ fontSize: 18, marginBottom: 8 }}>Event Closure Report</h2>
          <p className="text-sub mb-4">Final balance sheet and summary for completed events.</p>
          <button className="btn btn-primary">Generate Report</button>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
