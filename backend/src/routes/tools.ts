import { Router, Request, Response } from 'express';
import { CadastralService } from '../services/cadastralService';

const router = Router();

// Unit conversion endpoint
router.post('/convert-units', (req: Request, res: Response) => {
  const { value, fromUnit } = req.body;
  if (value === undefined || isNaN(Number(value))) {
    return res.status(400).json({ error: 'Please provide a valid numeric value.' });
  }

  const validUnits = ['decimal', 'katha', 'bigha', 'acre', 'sqft', 'sqm'];
  const unit = String(fromUnit || 'decimal').toLowerCase() as any;
  if (!validUnits.includes(unit)) {
    return res.status(400).json({ error: `Invalid unit. Supported units: ${validUnits.join(', ')}` });
  }

  const result = CadastralService.convertUnits(Number(value), unit);
  res.json({
    input: { value: Number(value), fromUnit: unit },
    result,
  });
});

// Faraez inheritance calculation endpoint
router.post('/faraez', (req: Request, res: Response) => {
  const { totalDecimal, sons = 0, daughters = 0, wife = 0, husband = 0, father = 0, mother = 0 } = req.body;

  if (totalDecimal === undefined || isNaN(Number(totalDecimal)) || Number(totalDecimal) <= 0) {
    return res.status(400).json({ error: 'Please provide a valid total land area in decimals.' });
  }

  const calculation = CadastralService.calculateFaraez({
    totalDecimal: Number(totalDecimal),
    sons: Math.max(0, parseInt(sons, 10) || 0),
    daughters: Math.max(0, parseInt(daughters, 10) || 0),
    wife: Math.max(0, parseInt(wife, 10) || 0),
    husband: Math.max(0, parseInt(husband, 10) || 0),
    father: Math.max(0, parseInt(father, 10) || 0),
    mother: Math.max(0, parseInt(mother, 10) || 0),
  });

  res.json({
    totalDecimal: Number(totalDecimal),
    ...calculation,
  });
});

// LD Tax demand estimation endpoint
router.post('/estimate-tax', (req: Request, res: Response) => {
  const { landClass, decimalArea } = req.body;
  if (!landClass || decimalArea === undefined || isNaN(Number(decimalArea))) {
    return res.status(400).json({ error: 'Please provide landClass and numeric decimalArea.' });
  }

  const estimate = CadastralService.estimateLdTax(String(landClass), Number(decimalArea));
  res.json({
    landClass,
    decimalArea: Number(decimalArea),
    ...estimate,
  });
});

export default router;
