import mysql, { PoolConnection } from 'mysql2';
import { ApplicationConfiguration } from '../config/application';
import { ITransactionQuery } from '../../types/types';

export class DatabaseScript {
    // Static pool for connections
    private static pool = mysql.createPool(ApplicationConfiguration.database);

    private constructor() {} // Prevent instantiation

    // Read a query (SELECT)
    public static executeReadQuery(query: string, params?: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            this.pool.query(query, params, (error, results) => {
                if (error) {
                    return reject(error);
                }
                resolve(results);
            });
        });
    }

    // Execute a query (INSERT, UPDATE, DELETE) and auto-commit
    public static executeWriteQuery(query: string, params?: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            this.pool.query(query, params, (error, results) => {
                if (error) {
                    return reject(error);
                }
                resolve(results);
            });
        });
    }

    // Begin, Commit, and Rollback a Transaction (USE when performing at least 2 query executes)
    public static executeTransaction(queries: ITransactionQuery[]): Promise<any[]> {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection: PoolConnection) => {
                if (err) {
                    return reject(err);
                }

                connection.beginTransaction((err) => {
                    if (err) {
                        connection.release();
                        return reject(err);
                    }

                    const promises = queries.map(({ query, params }) => {
                        return new Promise((resolve, reject) => {
                            connection.query(query, params, (err, results) => {
                                if (err) {
                                    return reject(err);
                                }
                                resolve(results);
                            });
                        });
                    });

                    Promise.all(promises)
                        .then((results) => {
                            connection.commit((err) => {
                                if (err) {
                                    return connection.rollback(() => {
                                        connection.release();
                                        reject(err);
                                    });
                                }
                                connection.release();
                                resolve(results);
                            });
                        })
                        .catch((err) => {
                            connection.rollback(() => {
                                connection.release();
                                reject(err);
                            });
                        });
                });
            });
        });
    }
}
