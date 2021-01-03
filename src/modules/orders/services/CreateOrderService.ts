import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({
    customer_id,
    products: requestProducts,
  }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Not found customer');
    }

    const products = await this.productsRepository.findAllById(requestProducts);

    if (!products.length) {
      throw new AppError('Not found products');
    }

    const ids = products.map(({ id }) => id);

    const notFounded = requestProducts.filter(product =>
      ids.every(id => id !== product.id),
    );

    if (notFounded.length) {
      throw new AppError(
        `Could not find products with ids [${notFounded.join(
          ', ',
        )}] on database.`,
      );
    }

    const preguiça = requestProducts.filter(
      porcamente =>
        products.filter(product => porcamente.id === product.id)[0].quantity <
        porcamente.quantity,
    );

    if (preguiça.length) {
      throw new AppError('Erro generico que ninguem vai ler');
    }

    const productsFinal = requestProducts.map(product => ({
      product_id: product.id,
      quantity: product.quantity,
      price: products.find(({ id }) => id === product.id)?.price ?? 0,
    }));

    const order = await this.ordersRepository.create({
      customer,
      products: productsFinal,
    });

    const { order_products: this_is_a_mistake } = order;

    const trash = this_is_a_mistake.map(mistake => {
      const product = products.find(({ id }) => id === mistake.product_id);
      let quantity = product?.quantity ?? 0;
      if (product) {
        quantity -= mistake.quantity;
      }
      const result = {
        id: mistake.product_id,
        quantity,
      };

      return result;
    });

    await this.productsRepository.updateQuantity(trash);

    return order;
  }
}

export default CreateOrderService;
