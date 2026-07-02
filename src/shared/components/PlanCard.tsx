import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { CreditCard, Check } from 'lucide-react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { Typography } from './Typography';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { Modal } from './Modal';

interface PlanCardProps {
  name: string;
  price: string;
  features: string[];
  isCurrent?: boolean;
  onSubscribeSuccess?: () => void;
}

export function PlanCard({
  name,
  price,
  features,
  isCurrent = false,
  onSubscribeSuccess,
}: PlanCardProps) {
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOpenPayment = () => {
    if (isCurrent) {
      Alert.alert('Plano Ativo', 'Você já está inscrito neste plano.');
      return;
    }
    setModalVisible(true);
  };

  const handleCheckout = () => {
    if (!cardNumber || !expiry || !cvc || !cardName) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos do cartão.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setModalVisible(false);
      Alert.alert('Sucesso', `Assinatura do plano ${name} realizada com sucesso (Simulado via Stripe)!`);
      if (onSubscribeSuccess) {
        onSubscribeSuccess();
      }
      setCardNumber('');
      setExpiry('');
      setCvc('');
      setCardName('');
    }, 2000);
  };

  return (
    <Card style={styles.cardContainer}>
      <View style={styles.header}>
        <Typography variant="h2">{name}</Typography>
        <Typography variant="h1" colorType="primary" style={styles.priceText}>
          {price}
        </Typography>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.featuresContainer}>
        {features.map((feature, idx) => (
          <View key={idx} style={styles.featureRow}>
            <Check size={16} color={theme.primaryColor} style={styles.checkIcon} />
            <Typography variant="body" colorType="textDim" style={styles.featureText}>
              {feature}
            </Typography>
          </View>
        ))}
      </View>

      <Button
        title={isCurrent ? 'Plano Atual' : 'Assinar Plano'}
        variant={isCurrent ? 'outline' : 'primary'}
        disabled={isCurrent}
        onPress={handleOpenPayment}
      />

      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Checkout Stripe (Simulado)"
      >
        <View style={styles.stripeHeader}>
          <CreditCard size={24} color={theme.primaryColor} />
          <Typography variant="h2" style={styles.stripeTitle}>
            Stripe Elements
          </Typography>
        </View>

        <Typography variant="caption" colorType="textMuted" style={styles.stripeSubtitle}>
          Modo MVP: Insira qualquer número fictício para testar.
        </Typography>

        <Input
          label="Nome no Cartão"
          placeholder="Ex: João Silva"
          value={cardName}
          onChangeText={setCardName}
        />

        <Input
          label="Número do Cartão"
          placeholder="4242 4242 4242 4242"
          keyboardType="numeric"
          maxLength={19}
          value={cardNumber}
          onChangeText={(val) => {
            const cleaned = val.replace(/\s?/g, '');
            const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
            setCardNumber(formatted);
          }}
        />

        <View style={styles.row}>
          <View style={styles.flexHalf}>
            <Input
              label="Validade"
              placeholder="MM/AA"
              keyboardType="numeric"
              maxLength={5}
              value={expiry}
              onChangeText={(val) => {
                const cleaned = val.replace(/\//g, '');
                if (cleaned.length >= 2) {
                  setExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`);
                } else {
                  setExpiry(cleaned);
                }
              }}
            />
          </View>
          <View style={[styles.flexHalf, styles.cvcGap]}>
            <Input
              label="CVC"
              placeholder="123"
              keyboardType="numeric"
              maxLength={3}
              value={cvc}
              onChangeText={setCvc}
            />
          </View>
        </View>

        <Button
          title={loading ? 'Processando...' : `Pagar ${price}`}
          loading={loading}
          onPress={handleCheckout}
          style={styles.payButton}
        />
      </Modal>
    </Card>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceText: {
    marginBottom: 0,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  featuresContainer: {
    marginVertical: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  checkIcon: {
    marginRight: 8,
  },
  featureText: {
    fontSize: 14,
  },
  stripeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stripeTitle: {
    marginLeft: 8,
    marginBottom: 0,
  },
  stripeSubtitle: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
  },
  flexHalf: {
    flex: 1,
  },
  cvcGap: {
    marginLeft: 12,
  },
  payButton: {
    marginTop: 16,
  },
});
