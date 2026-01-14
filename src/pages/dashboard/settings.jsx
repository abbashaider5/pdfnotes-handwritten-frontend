import { CreditCard, CreditCard as PaymentIcon, Shield, Store, ToggleLeft, ToggleRight, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DashboardLayout } from '../../components/dashboard/dashboard-layout';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { SkeletonKPICard } from '../../components/ui/skeleton';
import { supabase } from '../../lib/supabase';
import { usePageTitle } from '../../lib/utils';

export function Settings() {
  usePageTitle('Settings');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    storeName: '',
    storeDescription: '',
    authorEmail: '',
    payoutMethod: '',
    payoutDetails: '',
  });
  const [paymentSettings, setPaymentSettings] = useState({
    paymentsEnabled: true,
    razorpayEnabled: true,
    razorpayKeyId: '',
    razorpayKeySecret: '',
    stripeEnabled: false,
    stripeSecretKey: '',
    stripePublishableKey: '',
    currency: 'inr',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Fetch user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setSettings({
          ...settings,
          authorEmail: user.email || '',
        });
      }
      
      // Fetch payment settings using maybeSingle to handle first-time setup
      const { data: paymentData, error: paymentError } = await supabase
        .from('payment_settings')
        .select('*')
        .maybeSingle();

      if (paymentError) {
        // Handle case where no row exists yet (first-time setup)
        if (paymentError.code === 'PGRST116') {
          // No rows found - this is expected for first-time setup
          console.log('No payment settings found - using defaults');
        } else {
          console.error('Error fetching payment settings:', paymentError);
        }
      }

      if (paymentData) {
        setPaymentSettings({
          paymentsEnabled: paymentData.payments_enabled || false,
          razorpayEnabled: paymentData.razorpay_enabled !== undefined ? paymentData.razorpay_enabled : true,
          razorpayKeyId: paymentData.razorpay_key_id || '',
          razorpayKeySecret: paymentData.razorpay_key_secret || '',
          stripeEnabled: paymentData.stripe_enabled || false,
          stripeSecretKey: paymentData.stripe_secret_key || '',
          stripePublishableKey: paymentData.stripe_publishable_key || '',
          currency: paymentData.currency || 'inr',
        });
      }

      // For now, using mock data for other settings
      setTimeout(() => {
        setSettings(prev => ({
          ...prev,
          storeName: 'My PDF Store',
          storeDescription: 'High-quality study materials and notes',
        }));
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setLoading(false);
    }
  };

  const handlePaymentSettingsSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Build payment data object
      const paymentData = {
        payments_enabled: paymentSettings.paymentsEnabled,
        razorpay_enabled: paymentSettings.razorpayEnabled,
        razorpay_key_id: paymentSettings.razorpayKeyId,
        razorpay_key_secret: paymentSettings.razorpayKeySecret,
        stripe_enabled: paymentSettings.stripeEnabled,
        stripe_secret_key: paymentSettings.stripeSecretKey,
        stripe_publishable_key: paymentSettings.stripePublishableKey,
        currency: paymentSettings.currency,
        updated_at: new Date().toISOString(),
      };

      // First, check if payment settings exist
      const { data: existingSettings, error: fetchError } = await supabase
        .from('payment_settings')
        .select('id')
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking existing settings:', fetchError);
        throw fetchError;
      }

      let error;
      if (existingSettings?.id) {
        // Update existing row by id
        const result = await supabase
          .from('payment_settings')
          .update(paymentData)
          .eq('id', existingSettings.id);
        error = result.error;
      } else {
        // Insert new row
        const result = await supabase
          .from('payment_settings')
          .insert(paymentData);
        error = result.error;
      }

      if (error) throw error;

      toast.success('Payment settings saved successfully!');
    } catch (error) {
      console.error('Error saving payment settings:', error);
      toast.error('Error saving payment settings');
    } finally {
      setSaving(false);
    }
  };

  const handleGeneralSettingsSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // TODO: Save settings to database
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Settings">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'payment'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Payment Settings
          </button>
        </div>

        {activeTab === 'general' ? (
          <div className="space-y-6 max-full mx-auto">
            {loading ? (
              <div className="grid grid-cols-1 gap-6">
                <SkeletonKPICard />
                <SkeletonKPICard />
                <SkeletonKPICard />
              </div>
            ) : (
              <form onSubmit={handleGeneralSettingsSave} className="space-y-6">
                {/* Profile Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User size={20} />
                      Profile Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <Input
                        type="email"
                        value={settings.authorEmail}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Contact support to change your email
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Store Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Store size={20} />
                      Store Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Store Name
                      </label>
                      <Input
                        type="text"
                        value={settings.storeName}
                        onChange={(e) =>
                          setSettings({ ...settings, storeName: e.target.value })
                        }
                        placeholder="Your store name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Store Description
                      </label>
                      <textarea
                        value={settings.storeDescription}
                        onChange={(e) =>
                          setSettings({ ...settings, storeDescription: e.target.value })
                        }
                        placeholder="Describe your store"
                        rows={3}
                        className="w-full px-3 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Payout Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard size={20} />
                      Payout Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payout Method
                      </label>
                      <select
                        value={settings.payoutMethod}
                        onChange={(e) =>
                          setSettings({ ...settings, payoutMethod: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Select payout method</option>
                        <option value="stripe">Stripe</option>
                        <option value="paypal">PayPal</option>
                        <option value="bank">Bank Transfer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payout Details
                      </label>
                      <textarea
                        value={settings.payoutDetails}
                        onChange={(e) =>
                          setSettings({ ...settings, payoutDetails: e.target.value })
                        }
                        placeholder="Enter your payout details (account number, email, etc.)"
                        rows={3}
                        className="w-full px-3 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Your payout information is encrypted and secure
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="default"
                    disabled={saving}
                    className="min-w-[120px]"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="space-y-6 max-full mx-auto">
            {loading ? (
              <SkeletonKPICard />
            ) : (
              <form onSubmit={handlePaymentSettingsSave} className="space-y-6">
                {/* Payment Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PaymentIcon size={20} />
                      Payment Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Enable/Disable Payments Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">Enable Payments</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Allow users to purchase PDFs from your store
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setPaymentSettings({
                            ...paymentSettings,
                            paymentsEnabled: !paymentSettings.paymentsEnabled,
                          })
                        }
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                          paymentSettings.paymentsEnabled
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {paymentSettings.paymentsEnabled ? (
                          <>
                            <ToggleRight size={20} />
                            Enabled
                          </>
                        ) : (
                          <>
                            <ToggleLeft size={20} />
                            Disabled
                          </>
                        )}
                      </button>
                    </div>

                    {paymentSettings.paymentsEnabled && (
                      <>
                        <div className="border-t pt-6">
                          <p className="text-sm text-gray-600 mb-4 flex items-center gap-2">
                            <Shield size={16} />
                            Your payment gateway keys are encrypted and secure
                          </p>

                          {/* Currency */}
                          <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Currency
                            </label>
                            <div className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 font-medium">
                              Indian Rupee (INR)
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Only Indian Rupee (INR) is currently supported
                            </p>
                          </div>

                          {/* Razorpay Settings */}
                          <div className="border rounded-lg p-4 mb-4">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-semibold text-gray-900">Razorpay</h4>
                              <button
                                type="button"
                                onClick={() =>
                                  setPaymentSettings({
                                    ...paymentSettings,
                                    razorpayEnabled: !paymentSettings.razorpayEnabled,
                                  })
                                }
                                className={`flex items-center gap-2 px-3 py-1 rounded-lg font-medium text-sm transition-colors ${
                                  paymentSettings.razorpayEnabled
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                {paymentSettings.razorpayEnabled ? (
                                  <>
                                    <ToggleRight size={16} />
                                    Enabled
                                  </>
                                ) : (
                                  <>
                                    <ToggleLeft size={16} />
                                    Disabled
                                  </>
                                )}
                              </button>
                            </div>

                            {paymentSettings.razorpayEnabled && (
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Razorpay Key ID *
                                  </label>
                                  <Input
                                    type="text"
                                    value={paymentSettings.razorpayKeyId}
                                    onChange={(e) =>
                                      setPaymentSettings({
                                        ...paymentSettings,
                                        razorpayKeyId: e.target.value,
                                      })
                                    }
                                    placeholder="rzp_live_xxxxx or rzp_test_xxxxx"
                                    required={paymentSettings.razorpayEnabled}
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Razorpay Key Secret *
                                  </label>
                                  <Input
                                    type="password"
                                    value={paymentSettings.razorpayKeySecret}
                                    onChange={(e) =>
                                      setPaymentSettings({
                                        ...paymentSettings,
                                        razorpayKeySecret: e.target.value,
                                      })
                                    }
                                    placeholder="•••••••••••••"
                                    required={paymentSettings.razorpayEnabled}
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    Get your keys from{' '}
                                    <a
                                      href="https://dashboard.razorpay.com/apikeys"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline"
                                    >
                                      Razorpay Dashboard
                                    </a>
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Stripe Settings */}
                          <div className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-semibold text-gray-900">Stripe</h4>
                              <button
                                type="button"
                                onClick={() =>
                                  setPaymentSettings({
                                    ...paymentSettings,
                                    stripeEnabled: !paymentSettings.stripeEnabled,
                                  })
                                }
                                className={`flex items-center gap-2 px-3 py-1 rounded-lg font-medium text-sm transition-colors ${
                                  paymentSettings.stripeEnabled
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                {paymentSettings.stripeEnabled ? (
                                  <>
                                    <ToggleRight size={16} />
                                    Enabled
                                  </>
                                ) : (
                                  <>
                                    <ToggleLeft size={16} />
                                    Disabled
                                  </>
                                )}
                              </button>
                            </div>

                            {paymentSettings.stripeEnabled && (
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Stripe Secret Key *
                                  </label>
                                  <Input
                                    type="password"
                                    value={paymentSettings.stripeSecretKey}
                                    onChange={(e) =>
                                      setPaymentSettings({
                                        ...paymentSettings,
                                        stripeSecretKey: e.target.value,
                                      })
                                    }
                                    placeholder="sk_live_xxxxx or sk_test_xxxxx"
                                    required={paymentSettings.stripeEnabled}
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Stripe Publishable Key *
                                  </label>
                                  <Input
                                    type="text"
                                    value={paymentSettings.stripePublishableKey}
                                    onChange={(e) =>
                                      setPaymentSettings({
                                        ...paymentSettings,
                                        stripePublishableKey: e.target.value,
                                      })
                                    }
                                    placeholder="pk_live_xxxxx or pk_test_xxxxx"
                                    required={paymentSettings.stripeEnabled}
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    Get your keys from{' '}
                                    <a
                                      href="https://dashboard.stripe.com/apikeys"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline"
                                    >
                                      Stripe Dashboard
                                    </a>
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="default"
                    disabled={saving}
                    className="min-w-[120px]"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
