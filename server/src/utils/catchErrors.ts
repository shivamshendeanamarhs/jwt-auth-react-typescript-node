//A higher-order function that wraps an asynchronous Express controller function to handle errors gracefully.

//This function takes an asynchronous controller function (`AsyncController`) as an argument and returns a new function that catches any errors that occur during the execution of the controller. If an error is caught, it is passed to the next error-handling middleware using `next(error)`.

//This is useful for know that asynchronous errors in your controllers are properly handled without crashing the application or requiring additional `try-catch` blocks in each controller.

import { Request, Response, NextFunction } from "express";

type AsyncController = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

const catchErrors =
  (controller: AsyncController): AsyncController =>
  async (req, res, next) => {
    try {
      await controller(req, res, next);
    } catch (error) {
      // pass error on
      next(error);
    }
  };

export default catchErrors;